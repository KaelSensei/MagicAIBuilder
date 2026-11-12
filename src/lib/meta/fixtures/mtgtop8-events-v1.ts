/**
 * MTGTop8 search results, recorded from the live site after the archetype lookup.
 *
 * Both pages were recorded on 2026-11-12 (12:01 and 12:03 UTC) with
 * `POST https://www.mtgtop8.com/search`, sent with the app's User-Agent
 * (`MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`) and the form body the adapter
 * builds. Both came as `Content-Type: text/html; charset=ISO-8859-1`, about 167,000 bytes each.
 * Only the result block was kept: from the "decks matching" title through the closing
 * `</form>`. The search form around it, the page chrome and the scripts were dropped. Inside
 * the block, every byte is the site's own: the kept rows were checked against the recorded
 * bytes after re-encoding to Latin-1, and the tabs and trailing spaces are the site's.
 *
 * - {@link RECORDED_EVENTS_PAGE}: `format=EDH&current_page=&archetype_sel%5BEDH%5D=648`, the
 *   archetype of Atraxa, Praetors' Voice in `mtgtop8-search-form-v1.ts`. The live page lists
 *   25 of "45 decks matching"; this one keeps the first 6, which carry one to two stars, single
 *   and ranged placings ("4", "3-4", "5-8"), three accented event names and dates from 2023 to
 *   2026. Six rows, not five, so the adapter's cap of five is visible.
 * - {@link RECORDED_UNKNOWN_CARD_PAGE}: `format=EDH&current_page=&cards=Zzyzx+Nonexistent+Commander+Qq`,
 *   the card-content fallback for a commander the form does not list. MTGTop8 ignored the
 *   unknown name and answered with "44269 decks matching", the whole EDH section. This one
 *   keeps the first 2 of its 25 rows.
 *
 * @module meta/fixtures/mtgtop8-events-v1
 */

import { latin1Bytes } from "./mtgtop8-search-form-v1";

/** The archetype id the events page was searched by: Atraxa, Praetors' Voice. */
export const RECORDED_EVENTS_ARCHETYPE_ID = 648;

/** The commander words the meta route passes for that archetype. */
export const RECORDED_EVENTS_COMMANDER = "atraxa praetors voice";

/** The unknown card name the fallback search was recorded with. */
export const RECORDED_UNKNOWN_CARD_NAME = "Zzyzx Nonexistent Commander Qq";

/** The result block of the archetype search, as text, after Latin-1 decoding. */
export const RECORDED_EVENTS_PAGE = `<div class=w_title align=center>45 decks matching<div class=c_tl></div><div class=c_tr></div><div class=c_bl></div><div class=c_br></div></div>
<div style="display:flex;justify-content:center;margin:5px;"><div class=Nav_PN_no>Prev</div><div class=Nav_cur>1</div><div class=Nav_norm onclick=PageSubmit(2)>2</div><div class=Nav_norm onclick=PageSubmit(2)>Next</div></div>  
<form method=POST action=compare name=compare_decks>
<table border=0 class=Stable align=center width=100%>
	<tr>
	  <td><input type=checkbox name=checkall value=1 checked onClick="CheckAll()"></td>
	  <td>Deck</td>
	  <td>Player</td>
	  <td>Format</td>
	  <td>Event</td>
	  <td>Level</td>
	  <td>Rank</td>
	  <td>Date</td>
	</tr>
	
		<tr class=hover_tr>
		  <td><input type=checkbox name=deck_check[1] value=1 checked><input type=hidden name=deck_ref[1] value=896788></td>
		  <td class=S12><a href=event?e=91732&d=896788&f=EDH>Atraxa, Praetors' Voice</a></td>
		  <td class=G12><a class=player href=search?player=Lucas+Pelletier>Lucas Pelletier</a></td>
		  <td class=S12>Duel Commander</td>
		  <td class=S11><a href=event?e=91732&f=EDH>Mythique Hebdomadaire @ La Boutique Mythique (Québec, Québec)</a></td>
		  <td align=center><img src=/graph/star.png></td>
		  <td class=S12 align=center>5-8</td>
		  <td class=S11>05/10/26</td>
		</tr>
		<tr class=hover_tr>
		  <td><input type=checkbox name=deck_check[2] value=1 checked><input type=hidden name=deck_ref[2] value=888383></td>
		  <td class=S12><a href=event?e=90672&d=888383&f=EDH>Atraxa</a></td>
		  <td class=G12><a class=player href=search?player=Thibault+Malherbe>Thibault Malherbe</a></td>
		  <td class=S12>Duel Commander</td>
		  <td class=S11><a href=event?e=90672&f=EDH>Weekly League @ Le Vizz (Rouen, France)</a></td>
		  <td align=center><img src=/graph/star.png><img src=/graph/star.png></td>
		  <td class=S12 align=center>4</td>
		  <td class=S11>09/09/26</td>
		</tr>
		<tr class=hover_tr>
		  <td><input type=checkbox name=deck_check[3] value=1 checked><input type=hidden name=deck_ref[3] value=866412></td>
		  <td class=S12><a href=event?e=87824&d=866412&f=EDH>Atraxa Good Cards</a></td>
		  <td class=G12><a class=player href=search?player=Yuri>Yuri</a></td>
		  <td class=S12>Duel Commander</td>
		  <td class=S11><a href=event?e=87824&f=EDH>Thursduel BCN @ Magic Barcelona (Barcelona)</a></td>
		  <td align=center><img src=/graph/star.png><img src=/graph/star.png></td>
		  <td class=S12 align=center>3</td>
		  <td class=S11>25/06/26</td>
		</tr>
		<tr class=hover_tr>
		  <td><input type=checkbox name=deck_check[4] value=1 checked><input type=hidden name=deck_ref[4] value=662077></td>
		  <td class=S12><a href=event?e=61415&d=662077&f=EDH>Atraxa, Praetors' Voice</a></td>
		  <td class=G12><a class=player href=search?player=Kuness>Kuness</a></td>
		  <td class=S12>Duel Commander</td>
		  <td class=S11><a href=event?e=61415&f=EDH>Draw7 - Open Series 13 @ Thailand</a></td>
		  <td align=center><img src=/graph/star.png></td>
		  <td class=S12 align=center>6</td>
		  <td class=S11>26/10/24</td>
		</tr>
		<tr class=hover_tr>
		  <td><input type=checkbox name=deck_check[5] value=1 checked><input type=hidden name=deck_ref[5] value=631274></td>
		  <td class=S12><a href=event?e=57725&d=631274&f=EDH>Atraxa, Praetors' Voice</a></td>
		  <td class=G12><a class=player href=search?player=Hugo+Blanchet>Hugo Blanchet</a></td>
		  <td class=S12>Duel Commander</td>
		  <td class=S11><a href=event?e=57725&f=EDH>OCD Les fées Partajeux by Auro @ Martigues (France)</a></td>
		  <td align=center><img src=/graph/star.png></td>
		  <td class=S12 align=center>3-4</td>
		  <td class=S11>20/07/24</td>
		</tr>
		<tr class=hover_tr>
		  <td><input type=checkbox name=deck_check[6] value=1 checked><input type=hidden name=deck_ref[6] value=570547></td>
		  <td class=S12><a href=event?e=50071&d=570547&f=EDH>Atraxa</a></td>
		  <td class=G12><a class=player href=search?player=Hannimys>Hannimys</a></td>
		  <td class=S12>Duel Commander</td>
		  <td class=S11><a href=event?e=50071&f=EDH>DC de Noel 2023 du GOB L'Ain @ Ambérieu en Bugey (France)</a></td>
		  <td align=center><img src=/graph/star.png><img src=/graph/star.png></td>
		  <td class=S12 align=center>5-8</td>
		  <td class=S11>03/12/23</td>
		</tr>
	<tr ><td colspan=8 align=left><input type=submit value="Compare Decks"></td></tr>
</table>
</form>`;

/** The result block of the unknown-card fallback search, as text, after Latin-1 decoding. */
export const RECORDED_UNKNOWN_CARD_PAGE = `<div class=w_title align=center>44269 decks matching<div class=c_tl></div><div class=c_tr></div><div class=c_bl></div><div class=c_br></div></div>
<div style="display:flex;justify-content:center;margin:5px;"><div class=Nav_PN_no>Prev</div><div class=Nav_cur>1</div><div class=Nav_norm onclick=PageSubmit(2)>2</div><div class=Nav_norm onclick=PageSubmit(3)>3</div><div class=Nav_norm onclick=PageSubmit(4)>4</div><div class=Nav_norm onclick=PageSubmit(5)>5</div><div class=Nav_norm onclick=PageSubmit(6)>6</div><div class=Nav_norm onclick=PageSubmit(7)>7</div><div class=Nav_norm onclick=PageSubmit(8)>8</div><div class=Nav_norm onclick=PageSubmit(2)>Next</div></div>  
<form method=POST action=compare name=compare_decks>
<table border=0 class=Stable align=center width=100%>
	<tr>
	  <td><input type=checkbox name=checkall value=1 checked onClick="CheckAll()"></td>
	  <td>Deck</td>
	  <td>Player</td>
	  <td>Format</td>
	  <td>Event</td>
	  <td>Level</td>
	  <td>Rank</td>
	  <td>Date</td>
	</tr>
	
		<tr class=hover_tr>
		  <td><input type=checkbox name=deck_check[1] value=1 checked><input type=hidden name=deck_ref[1] value=911462></td>
		  <td class=S12><a href=event?e=93674&d=911462&f=EDH>Teddy Riner Président !</a></td>
		  <td class=G12><a class=player href=search?player=Philippe+Lipinski>Philippe Lipinski</a></td>
		  <td class=S12>Duel Commander</td>
		  <td class=S11><a href=event?e=93674&f=EDH>Geek Factory X MTG94 @ Geek Factory (Nogent Sur Marne, France)</a></td>
		  <td align=center><img src=/graph/star.png></td>
		  <td class=S12 align=center>1</td>
		  <td class=S11>10/11/26</td>
		</tr>
		<tr class=hover_tr>
		  <td><input type=checkbox name=deck_check[2] value=1 checked><input type=hidden name=deck_ref[2] value=911463></td>
		  <td class=S12><a href=event?e=93674&d=911463&f=EDH>Jcvd</a></td>
		  <td class=G12><a class=player href=search?player=David+"dadou"+Fdida>David "dadou" Fdida</a></td>
		  <td class=S12>Duel Commander</td>
		  <td class=S11><a href=event?e=93674&f=EDH>Geek Factory X MTG94 @ Geek Factory (Nogent Sur Marne, France)</a></td>
		  <td align=center><img src=/graph/star.png></td>
		  <td class=S12 align=center>2</td>
		  <td class=S11>10/11/26</td>
		</tr>
	<tr ><td colspan=8 align=left><input type=submit value="Compare Decks"></td></tr>
</table>
</form>`;

/** The archetype search results as the wire carries them. */
export function eventsPageLatin1Bytes(): ArrayBuffer {
  return latin1Bytes(RECORDED_EVENTS_PAGE);
}

/** The unknown-card search results as the wire carries them. */
export function unknownCardPageLatin1Bytes(): ArrayBuffer {
  return latin1Bytes(RECORDED_UNKNOWN_CARD_PAGE);
}
