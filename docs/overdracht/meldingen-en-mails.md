# Meldingen en korte e-mails

Alle onderstaande teksten zijn letterlijk. Variabelen veilig als tekst invullen; links zijn eigen authenticated routes, nooit een publieke link naar kindgegevens. E-mail is voor de ouder, niet het kind. Noem geen antwoorden, achterstandslabels, kindnaam of groep in het mailonderwerp. Geen marketing, donorboodschappen of trackingpixels. In demo verschijnt de mail in de lokale inspecteerbare outbox, met label Demonstratie.

| Gebeurtenis | Melding in Mees | Mailonderwerp | Korte body |
|---|---|---|---|
| Mogelijk tutorhulp | Extra uitleg kan helpen bij {onderwerp}. Bekijk wat al is geprobeerd. | Mees: bekijk een voorstel voor uitleg | Er staat in Mees een voorstel voor extra uitleg klaar. Je kunt daar bekijken wat is geoefend en of tutorhulp passend is. [Bekijk in Mees] |
| Aanvraag doorgestuurd | De hulpvraag is naar een tutor gestuurd. | Mees: je hulpvraag is ontvangen | De tutor kan de hulpvraag nu bekijken. Je ziet de status in Mees. [Open Mees] |
| Nieuwe tutoruitleg | Er staat uitleg voor je klaar over {onderwerp}. | Mees: nieuwe uitleg staat klaar | De tutor heeft uitleg toegevoegd. Je kind kan deze in Mees bekijken en daarna zelf een vraag proberen. [Bekijk in Mees] |
| Live uitnodiging | Een les over {onderwerp}: {datum} om {tijd}. | Mees: uitnodiging voor een les | Er is een passende les gepland op {datum} om {tijd}. Deelname is vrijwillig. Bekijk de uitleg en je toestemming in Mees. [Bekijk uitnodiging] |
| Les gewijzigd | De les begint nu op {datum} om {tijd}. | Mees: de lestijd is gewijzigd | De geplande les heeft een nieuwe tijd: {datum} om {tijd}. Bekijk de wijziging in Mees. [Bekijk les] |
| Les geannuleerd | Deze les gaat niet door. Je kunt verder oefenen. | Mees: een les gaat niet door | De geplande les is geannuleerd. Je kunt in Mees verder oefenen. [Open Mees] |
| Plek beschikbaar | Er is een plek vrijgekomen voor de les. | Mees: er is een plek beschikbaar | Voor de les op {datum} om {tijd} is een plek vrijgekomen. Bekijk in Mees of je wilt deelnemen. [Bekijk les] |
| Opname beschikbaar | Je kunt de uitleg nu terugkijken. | Mees: uitleg om terug te kijken | De gecontroleerde lesopname staat in Mees. Je kind kan deze bekijken wanneer dat past. [Bekijk uitleg] |
| Vraagzenden beperkt | Je kunt nu geen nieuwe vraag sturen. Je kunt wel blijven luisteren. | Mees: bekijk een bericht over de les | Er staat een bericht over het vragen stellen tijdens een les klaar. Bekijk de uitleg en eventuele vervolgstap in Mees. [Bekijk bericht] |
| Account bevestigen | Controleer je e-mail om het account te bevestigen. | Bevestig je Mees-account | Open de link om je gratis ouderaccount te bevestigen. Heb je dit niet aangevraagd? Dan hoef je niets te doen. [Bevestig account] |
| Wachtwoord herstellen | Als er een account bij dit adres hoort, is een herstelmail verstuurd. | Herstel je Mees-wachtwoord | Open de link om een nieuw wachtwoord te kiezen. Heb je dit niet aangevraagd? Dan hoef je niets te doen. [Herstel wachtwoord] |

Auth-verificatie/herstel is essentieel voor het account; leer-/lesmails volgen oudervoorkeur en toestemming. In-app blijft de bron van status. Geen pushdienst nodig voor deze scope. Eén optionele herinnering als bouwvoorstel, niet standaard herhaald aandringen. Bewaar event/recipient/templateversion voor dedupe; providerfout geeft pending/retry, geen onbewezen ‘verstuurd’. Een gebruikersmelding noemt alleen daadwerkelijk opgeslagen informatie.
