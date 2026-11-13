/**
 * MTGTop8 card-content searches (`cards=`), recorded from the live site: the search the adapter
 * falls back to for a commander the archetype form does not list.
 *
 * Both pages came from `POST https://www.mtgtop8.com/search`, sent with the app's User-Agent
 * (`MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`) and the form body the adapter
 * builds; both came back as `Content-Type: text/html; charset=ISO-8859-1`, about 160,000 to
 * 167,000 bytes. Each keeps two blocks of its page: the search form from its card row (the
 * `cards` textarea) to the form's closing tag, then the results from the "decks matching" title
 * through the closing `</form>`, with only the first rows kept. Inside the blocks every byte is
 * the site's own, checked line by line against the recording after re-encoding to Latin-1; the
 * tabs, the trailing spaces and the one carriage return are the site's.
 *
 * The card row is what tells the two outcomes of a card search apart; the parser reads it
 * (`readCardFilterEcho` in `../mtgtop8`):
 *
 * - {@link RECORDED_UNKNOWN_CARD_PAGE}, 2026-11-12 12:03 UTC,
 *   `format=EDH&current_page=&cards=Zzyzx+Nonexistent+Commander+Qq`. MTGTop8 knows no such card:
 *   it prints "No match for …" in red, echoes an **empty** `cards` textarea and answers with the
 *   whole EDH section, "44269 decks matching" (first 2 of the page's 25 rows kept). This is the
 *   page `fetch.replay.test.ts` pinned under MI-02 (#1455) before the fix.
 * - {@link RECORDED_KNOWN_CARD_PAGE}, 2026-11-12 16:36 UTC,
 *   `format=EDH&current_page=&cards=Iroas%2C+God+of+Victory`. A real card the site knows but
 *   listed under no EDH archetype that day (the live form held 852 options, none for it). The
 *   textarea echoes `Iroas, God of Victory` followed by a carriage return, written `\r` below,
 *   and the answer is the "15 decks matching" that contain the card, all on one page, so no pager
 *   (first 5 of 15 rows kept; the sixth carries a carriage return inside its deck name).
 *
 * @module meta-insights/infrastructure/fixtures/mtgtop8-card-search-v1
 */

import { latin1Bytes } from "./mtgtop8-search-form-v1";

/** The card name MTGTop8 did not know: the fallback search was recorded with it. */
export const RECORDED_UNKNOWN_CARD_NAME = "Zzyzx Nonexistent Commander Qq";

/** The card MTGTop8 knows but lists under no EDH archetype: the other fallback search. */
export const RECORDED_KNOWN_CARD_NAME = "Iroas, God of Victory";

/** The unknown-card search, as text, after Latin-1 decoding: empty echo, whole section. */
export const RECORDED_UNKNOWN_CARD_PAGE = `  <tr><td colspan=2 align=center><font color=#ff3333>No match for Zzyzx Nonexistent Commander Qq</font><br><textarea name=cards style="width:230;height:60;"></textarea></td></tr>
	
	<tr>
	  <td cosplan=2 class=G14>&bull; Period</td>
	</tr>
	<tr>
	  <td align=center>From</td>
	  <td><input type=text name=date_start style="width:100px;font-size:13px;" value="" placeholder="D/M/Y"></td>
	</tr>
	<tr>
	  <td align=center>To</td>
	  <td><input type=text name=date_end style="width:100px;font-size:13px;" value="" placeholder="D/M/Y"></td>
	</tr>
	<tr>
	  <td colspan=2 align=center><input type=submit value=Search></td>
	</tr>
	</table>
	</form></div>
  <div style="width:80%;">
<div class=w_title align=center>44269 decks matching<div class=c_tl></div><div class=c_tr></div><div class=c_bl></div><div class=c_br></div></div>
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
</form></div>`;

/** The known-card search, as text, after Latin-1 decoding: the filter echoed, 15 decks. */
export const RECORDED_KNOWN_CARD_PAGE = `  <tr><td colspan=2 align=center><textarea name=cards style="width:230;height:60;">Iroas, God of Victory\r</textarea></td></tr>
	
	<tr>
	  <td cosplan=2 class=G14>&bull; Period</td>
	</tr>
	<tr>
	  <td align=center>From</td>
	  <td><input type=text name=date_start style="width:100px;font-size:13px;" value="" placeholder="D/M/Y"></td>
	</tr>
	<tr>
	  <td align=center>To</td>
	  <td><input type=text name=date_end style="width:100px;font-size:13px;" value="" placeholder="D/M/Y"></td>
	</tr>
	<tr>
	  <td colspan=2 align=center><input type=submit value=Search></td>
	</tr>
	</table>
	</form></div>
  <div style="width:80%;">
<div class=w_title align=center>15 decks matching<div class=c_tl></div><div class=c_tr></div><div class=c_bl></div><div class=c_br></div></div>
  
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
		  <td><input type=checkbox name=deck_check[1] value=1 checked><input type=hidden name=deck_ref[1] value=697625></td>
		  <td class=S12><a href=event?e=65809&d=697625&f=EDH>Dog's Rulez</a></td>
		  <td class=G12><a class=player href=search?player=Nacho>Nacho</a></td>
		  <td class=S12>Duel Commander</td>
		  <td class=S11><a href=event?e=65809&f=EDH>Saturduel @ Magic Barcelona (Barcelona)</a></td>
		  <td align=center><img src=/graph/star.png></td>
		  <td class=S12 align=center>6</td>
		  <td class=S11>08/03/25</td>
		</tr>
		<tr class=hover_tr>
		  <td><input type=checkbox name=deck_check[2] value=1 checked><input type=hidden name=deck_ref[2] value=697860></td>
		  <td class=S12><a href=event?e=65838&d=697860&f=EDH>Dog's Rulez</a></td>
		  <td class=G12><a class=player href=search?player=Nacho>Nacho</a></td>
		  <td class=S12>Duel Commander</td>
		  <td class=S11><a href=event?e=65838&f=EDH>FNM Duel BCN @ inGenio (Barcelona)</a></td>
		  <td align=center><img src=/graph/star.png></td>
		  <td class=S12 align=center>4</td>
		  <td class=S11>07/03/25</td>
		</tr>
		<tr class=hover_tr>
		  <td><input type=checkbox name=deck_check[3] value=1 checked><input type=hidden name=deck_ref[3] value=693749></td>
		  <td class=S12><a href=event?e=65276&d=693749&f=EDH>Dog's Rulez</a></td>
		  <td class=G12><a class=player href=search?player=Nacho>Nacho</a></td>
		  <td class=S12>Duel Commander</td>
		  <td class=S11><a href=event?e=65276&f=EDH>Open Barcelona  @ Gameria (Barcelona)</a></td>
		  <td align=center><img src=/graph/star.png></td>
		  <td class=S12 align=center>2</td>
		  <td class=S11>23/02/25</td>
		</tr>
		<tr class=hover_tr>
		  <td><input type=checkbox name=deck_check[4] value=1 checked><input type=hidden name=deck_ref[4] value=613955></td>
		  <td class=S12><a href=event?e=55624&d=613955&f=EDH>Yoshimaru, Ever Faithful + Rograkh, Son Of Rohgahh</a></td>
		  <td class=G12><a class=player href=search?player=Guang+Guang>Guang Guang</a></td>
		  <td class=S12>Duel Commander</td>
		  <td class=S11><a href=event?e=55624&f=EDH>Weekly @ Toybox Club (ShenZhen, China)</a></td>
		  <td align=center><img src=/graph/star.png></td>
		  <td class=S12 align=center>2</td>
		  <td class=S11>18/05/24</td>
		</tr>
		<tr class=hover_tr>
		  <td><input type=checkbox name=deck_check[5] value=1 checked><input type=hidden name=deck_ref[5] value=623033></td>
		  <td class=S12><a href=event?e=54886&d=623033&f=EDH>General Ferrous Rokiric</a></td>
		  <td class=G12><a class=player href=search?player=William>William</a></td>
		  <td class=S12>Duel Commander</td>
		  <td class=S11><a href=event?e=54886&f=EDH>DC - Points Event @ Neverland</a></td>
		  <td align=center><img src=/graph/star.png><img src=/graph/star.png></td>
		  <td class=S12 align=center>4</td>
		  <td class=S11>14/04/24</td>
		</tr>
	<tr ><td colspan=8 align=left><input type=submit value="Compare Decks"></td></tr>
</table>
</form></div>`;

/** The unknown-card search results as the wire carries them. */
export function unknownCardPageLatin1Bytes(): ArrayBuffer {
  return latin1Bytes(RECORDED_UNKNOWN_CARD_PAGE);
}

/** The known-card search results as the wire carries them. */
export function knownCardPageLatin1Bytes(): ArrayBuffer {
  return latin1Bytes(RECORDED_KNOWN_CARD_PAGE);
}
