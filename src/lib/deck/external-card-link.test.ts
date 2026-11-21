import { describe, expect, it } from "vitest";
import {
  readExternalCardReference,
  type DroppedPayload,
} from "@/lib/deck/external-card-link";

// Hand-written payloads, shaped as browsers hand them over when a card is dragged or pasted
// from another site. No test reaches any of these addresses.
const BOLT_ID = "7673784e-db4b-43a1-8d55-1bb9fc1e284f";
const BOLT_IMAGE = `https://cards.scryfall.io/normal/front/7/6/${BOLT_ID}.jpg?1783903008`;
const BOLT_API = `https://api.scryfall.com/cards/${BOLT_ID}`;
const SOL_RING_PAGE = "https://scryfall.com/card/c21/263/sol-ring";
const SOL_RING_EDHREC = "https://edhrec.com/cards/sol-ring";

function payload(fields: Partial<DroppedPayload>): DroppedPayload {
  return { uriList: "", plainText: "", html: "", hasFiles: false, ...fields };
}

describe("reading a card out of a dropped or pasted payload", () => {
  it("reads a Scryfall card page as its set code and collector number", () => {
    expect(
      readExternalCardReference(payload({ uriList: SOL_RING_PAGE }))
    ).toEqual({
      kind: "set-number",
      set: "c21",
      collectorNumber: "263",
    });
  });

  it("reads a Scryfall card page that carries no name slug", () => {
    expect(
      readExternalCardReference(
        payload({ plainText: "https://scryfall.com/card/c21/263" })
      )
    ).toEqual({ kind: "set-number", set: "c21", collectorNumber: "263" });
  });

  it("reads a decoded special collector number such as a star", () => {
    expect(
      readExternalCardReference(
        payload({
          uriList: "https://scryfall.com/card/pmei/1%E2%98%85/sol-ring",
        })
      )
    ).toEqual({ kind: "set-number", set: "pmei", collectorNumber: "1★" });
  });

  it("reads a Scryfall image address as its Scryfall id", () => {
    expect(readExternalCardReference(payload({ uriList: BOLT_IMAGE }))).toEqual(
      {
        kind: "scryfall-id",
        id: BOLT_ID,
      }
    );
  });

  it("reads the back face image of a two-faced card as the card's id", () => {
    const back = `https://cards.scryfall.io/large/back/7/6/${BOLT_ID}.png`;
    expect(readExternalCardReference(payload({ uriList: back }))).toEqual({
      kind: "scryfall-id",
      id: BOLT_ID,
    });
  });

  it("reads a Scryfall API address as its Scryfall id", () => {
    expect(readExternalCardReference(payload({ plainText: BOLT_API }))).toEqual(
      {
        kind: "scryfall-id",
        id: BOLT_ID,
      }
    );
  });

  it("reads an EDHREC card page as a name to look up loosely", () => {
    expect(
      readExternalCardReference(payload({ uriList: SOL_RING_EDHREC }))
    ).toEqual({
      kind: "name",
      name: "sol ring",
      match: "fuzzy",
    });
  });

  it("reads one line of plain text as an exact card name", () => {
    expect(
      readExternalCardReference(payload({ plainText: "  Sol Ring \n" }))
    ).toEqual({
      kind: "name",
      name: "Sol Ring",
      match: "exact",
    });
  });

  it("keeps a colon inside a card name as a name, not an address", () => {
    expect(
      readExternalCardReference(
        payload({ plainText: "Circle of Protection: Red" })
      )
    ).toEqual({
      kind: "name",
      name: "Circle of Protection: Red",
      match: "exact",
    });
  });

  it("prefers the link list over the plain text", () => {
    expect(
      readExternalCardReference(
        payload({ uriList: BOLT_IMAGE, plainText: "Sol Ring" })
      )
    ).toEqual({ kind: "scryfall-id", id: BOLT_ID });
  });

  it("skips the comment lines of a link list", () => {
    expect(
      readExternalCardReference(
        payload({ uriList: `# dragged\r\n${BOLT_API}\r\n` })
      )
    ).toEqual({ kind: "scryfall-id", id: BOLT_ID });
  });

  it("reads only the first image address out of dropped HTML", () => {
    const html = `<a href="javascript:alert(1)"><img src="${BOLT_IMAGE}" alt="x"></a>`;
    expect(readExternalCardReference(payload({ html }))).toEqual({
      kind: "scryfall-id",
      id: BOLT_ID,
    });
  });

  it("reads the first link out of dropped HTML when it holds no image", () => {
    const html = `<p>See <a href='${SOL_RING_EDHREC}'>Sol Ring</a></p>`;
    expect(readExternalCardReference(payload({ html }))).toEqual({
      kind: "name",
      name: "sol ring",
      match: "fuzzy",
    });
  });

  it("refuses a link from another site", () => {
    expect(
      readExternalCardReference(
        payload({ uriList: "https://www.moxfield.com/cards/abc" })
      )
    ).toEqual({ kind: "refused", reason: "unreadable-link" });
  });

  it("refuses a javascript address", () => {
    expect(
      readExternalCardReference(
        payload({ plainText: "javascript:alert(document.cookie)" })
      )
    ).toEqual({ kind: "refused", reason: "unreadable-link" });
  });

  it("refuses a Scryfall address over plain http", () => {
    expect(
      readExternalCardReference(
        payload({ uriList: "http://scryfall.com/card/c21/263/sol-ring" })
      )
    ).toEqual({ kind: "refused", reason: "unreadable-link" });
  });

  it("refuses a Scryfall image whose id is not a UUID", () => {
    expect(
      readExternalCardReference(
        payload({
          uriList: "https://cards.scryfall.io/normal/front/7/6/not-an-id.jpg",
        })
      )
    ).toEqual({ kind: "refused", reason: "unreadable-link" });
  });

  it("refuses a Scryfall page whose set code has the wrong shape", () => {
    expect(
      readExternalCardReference(
        payload({ uriList: "https://scryfall.com/card/../263/sol-ring" })
      )
    ).toEqual({ kind: "refused", reason: "unreadable-link" });
  });

  it("refuses a Scryfall address that is not a card", () => {
    expect(
      readExternalCardReference(
        payload({ uriList: "https://scryfall.com/sets/c21" })
      )
    ).toEqual({ kind: "refused", reason: "unreadable-link" });
  });

  it("refuses an EDHREC slug with characters other than letters, digits and hyphens", () => {
    expect(
      readExternalCardReference(
        payload({ uriList: "https://edhrec.com/cards/sol_ring%2F.." })
      )
    ).toEqual({ kind: "refused", reason: "unreadable-link" });
  });

  it("refuses an EDHREC page that is not a card page", () => {
    expect(
      readExternalCardReference(
        payload({ uriList: "https://edhrec.com/commanders/atraxa" })
      )
    ).toEqual({ kind: "refused", reason: "unreadable-link" });
  });

  it("ignores a payload over 10 KB without reading it", () => {
    const huge = `${SOL_RING_EDHREC}?q=${"a".repeat(10 * 1024)}`;
    expect(readExternalCardReference(payload({ uriList: huge }))).toEqual({
      kind: "ignored",
    });
  });

  it("ignores text of several lines, which is the import's job", () => {
    expect(
      readExternalCardReference(
        payload({ plainText: "Sol Ring\nArcane Signet" })
      )
    ).toEqual({
      kind: "ignored",
    });
  });

  it("ignores a line longer than 200 characters", () => {
    expect(
      readExternalCardReference(payload({ plainText: "a".repeat(201) }))
    ).toEqual({
      kind: "ignored",
    });
  });

  it("ignores an empty payload", () => {
    expect(readExternalCardReference(payload({}))).toEqual({ kind: "ignored" });
  });

  it("reports a dropped file that carries no address", () => {
    expect(readExternalCardReference(payload({ hasFiles: true }))).toEqual({
      kind: "file",
    });
  });

  it("reads the address of a dragged image even when the browser also offers it as a file", () => {
    expect(
      readExternalCardReference(
        payload({ uriList: BOLT_IMAGE, hasFiles: true })
      )
    ).toEqual({
      kind: "scryfall-id",
      id: BOLT_ID,
    });
  });
});
