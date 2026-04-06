#!/usr/bin/env python3
"""
Validate a list of MTG card names against Scryfall API.
Checks: existence, commander legality, color identity, price.

Usage:
    python validate_cards.py "Sol Ring" "Counterspell" "Fake Card Name"
    python validate_cards.py --commander "Atraxa, Praetors' Voice" --budget 5 "Rhystic Study" "Swords to Plowshares"
    python validate_cards.py --file decklist.txt --commander "Korvold, Fae-Cursed King" --budget 10
"""

import sys
import json
import time
import argparse
import urllib.request
import urllib.parse
import urllib.error


SCRYFALL_BASE = "https://api.scryfall.com"
DELAY = 0.1  # 100ms between requests


def fetch_card(name: str) -> dict | None:
    """Fetch a card by exact name from Scryfall."""
    url = f"{SCRYFALL_BASE}/cards/named?exact={urllib.parse.quote(name)}"
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "MTGCommanderAnalysis/1.0",
            "Accept": "application/json"
        })
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def fetch_card_fuzzy(name: str) -> dict | None:
    """Fetch a card by fuzzy name from Scryfall."""
    url = f"{SCRYFALL_BASE}/cards/named?fuzzy={urllib.parse.quote(name)}"
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "MTGCommanderAnalysis/1.0",
            "Accept": "application/json"
        })
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError:
        return None


def get_color_identity(card: dict) -> set:
    """Extract color identity from card object."""
    return set(card.get("color_identity", []))


def validate_card(card_name: str, commander_identity: set | None = None, budget: float | None = None) -> dict:
    """Validate a single card. Returns a result dict."""
    result = {
        "name": card_name,
        "valid": False,
        "issues": [],
        "data": {}
    }

    # Try exact match first, then fuzzy
    card = fetch_card(card_name)
    if card is None:
        card = fetch_card_fuzzy(card_name)
        if card is None:
            result["issues"].append("CARD NOT FOUND - does not exist in Scryfall")
            return result
        else:
            result["data"]["corrected_name"] = card["name"]
            if card["name"].lower() != card_name.lower():
                result["issues"].append(f"NAME CORRECTED: '{card_name}' -> '{card['name']}'")

    result["data"]["name"] = card["name"]
    result["data"]["mana_cost"] = card.get("mana_cost", "N/A")
    result["data"]["type_line"] = card.get("type_line", "N/A")
    result["data"]["color_identity"] = card.get("color_identity", [])

    # Check commander legality
    legalities = card.get("legalities", {})
    commander_legal = legalities.get("commander", "not_legal")
    result["data"]["commander_legality"] = commander_legal
    if commander_legal == "banned":
        result["issues"].append("BANNED in Commander")
    elif commander_legal == "not_legal":
        result["issues"].append("NOT LEGAL in Commander")

    # Check color identity
    if commander_identity is not None:
        card_identity = get_color_identity(card)
        if not card_identity.issubset(commander_identity):
            extra = card_identity - commander_identity
            result["issues"].append(f"COLOR IDENTITY VIOLATION: card has {extra} not in commander's identity")

    # Check price
    prices = card.get("prices", {})
    usd_price = prices.get("usd") or prices.get("usd_foil")
    if usd_price:
        result["data"]["price_usd"] = float(usd_price)
        if budget is not None and float(usd_price) > budget:
            result["issues"].append(f"OVER BUDGET: ${usd_price} > ${budget} limit")
    else:
        result["data"]["price_usd"] = None

    # EDHREC rank
    result["data"]["edhrec_rank"] = card.get("edhrec_rank")

    if not result["issues"]:
        result["valid"] = True

    return result


def parse_decklist_file(filepath: str) -> list[str]:
    """Parse a decklist file. Supports formats: '1 Card Name', 'Card Name', '1x Card Name'."""
    cards = []
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or line.startswith("//"):
                continue
            # Remove quantity prefix
            parts = line.split(" ", 1)
            if parts[0].rstrip("x").isdigit() and len(parts) > 1:
                cards.append(parts[1].strip())
            else:
                cards.append(line)
    return cards


def commander_identity_from_name(name: str) -> set | None:
    """Fetch a commander's color identity."""
    card = fetch_card(name)
    if card is None:
        card = fetch_card_fuzzy(name)
    if card:
        return get_color_identity(card)
    return None


def main():
    parser = argparse.ArgumentParser(description="Validate MTG cards for Commander")
    parser.add_argument("cards", nargs="*", help="Card names to validate")
    parser.add_argument("--commander", type=str, help="Commander name (for color identity check)")
    parser.add_argument("--budget", type=float, help="Max price per card in USD")
    parser.add_argument("--file", type=str, help="Path to decklist file")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    cards = list(args.cards)
    if args.file:
        cards.extend(parse_decklist_file(args.file))

    if not cards:
        print("No cards to validate. Provide card names as arguments or use --file.")
        sys.exit(1)

    # Get commander identity if specified
    commander_identity = None
    if args.commander:
        print(f"Fetching commander identity for: {args.commander}")
        commander_identity = commander_identity_from_name(args.commander)
        if commander_identity is None:
            print(f"WARNING: Could not find commander '{args.commander}'")
        else:
            print(f"Commander color identity: {commander_identity}")
        time.sleep(DELAY)

    results = []
    for i, card_name in enumerate(cards):
        if i > 0:
            time.sleep(DELAY)
        result = validate_card(card_name, commander_identity, args.budget)
        results.append(result)

        if not args.json:
            status = "OK" if result["valid"] else "ISSUE"
            price = result["data"].get("price_usd")
            price_str = f"${price:.2f}" if price else "N/A"
            print(f"[{status}] {result['data'].get('name', card_name)} ({price_str})")
            for issue in result["issues"]:
                print(f"       {issue}")

    if args.json:
        print(json.dumps(results, indent=2))

    # Summary
    valid_count = sum(1 for r in results if r["valid"])
    total = len(results)
    total_price = sum(r["data"].get("price_usd", 0) or 0 for r in results)

    if not args.json:
        print(f"\n--- Summary ---")
        print(f"Valid: {valid_count}/{total}")
        print(f"Issues: {total - valid_count}/{total}")
        print(f"Total price: ${total_price:.2f}")


if __name__ == "__main__":
    main()
