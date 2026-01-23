# Web Tester Bot

De Web Tester Bot is een project dat is opgezet om websites automatisch te testen vanuit het perspectief van een echte gebruiker. In plaats van vooraf vastgelegde testscripts, verkent de bot een pagina zelfstandig, herkent interactieve onderdelen en voert gecontroleerde acties uit om te controleren of deze onderdelen correct functioneren. De nadruk ligt daarbij op elementen die direct invloed hebben op conversie, zoals knoppen en formulieren.

### Doel

Het doel van dit project is om snel inzicht te krijgen in functionele problemen die de gebruikerservaring en conversie kunnen schaden. Denk aan knoppen die niet reageren, formulieren die fouten geven zonder duidelijke melding, of pagina’s die vastlopen na een actie. De bot helpt om dit soort problemen automatisch te signaleren, zonder dat voor elke pagina handmatig tests hoeven te worden geschreven.

### Werking

De bot werkt door een opgegeven webpagina te openen in een echte browser. Vervolgens analyseert hij de pagina en bepaalt welke elementen interactief zijn. Deze elementen worden op een veilige manier getest. Tijdens elke interactie wordt continu gemonitord of er fouten optreden, zoals JavaScript errors, mislukte netwerkverzoeken of onverwachte navigatie. Wanneer er iets misgaat, wordt dit vastgelegd in een rapport en ondersteund met een screenshot en een video van het testproces.

De huidige versie van het project richt zich bewust op een beperkte scope. Op dit moment test de bot uitsluitend knoppen. Hij herkent zichtbare en klikbare knoppen, voert een klikactie uit en controleert of deze actie leidt tot fouten of ongewenst gedrag. Risicovolle acties, zoals betalingen of verwijderacties, worden automatisch overgeslagen om schade te voorkomen. Deze focus op één elementtype maakt het mogelijk om een stabiele basis te bouwen waarop later kan worden voortgebouwd.

De architectuur van het project is modulair opgezet. Elk type interactief element krijgt uiteindelijk zijn eigen logica voor herkenning en testen. Algemene onderdelen, zoals browserinstellingen, logging en foutdetectie, zijn centraal geregeld. Hierdoor is het project eenvoudig uit te breiden met nieuwe testmodules, zonder dat bestaande functionaliteit aangepast hoeft te worden.

In de toekomst kan de Web Tester Bot worden uitgebreid met het testen van formulieren, navigatie, modals, cookie banners en complete conversieflows. Ook kan er meer intelligentie worden toegevoegd, zoals het herkennen van herhaalde states of het prioriteren van elementen op basis van hun belang voor conversie.

De Web Tester Bot is bedoeld als ondersteunend hulpmiddel voor kwaliteitscontrole en debugging. Het vervangt geen uitgebreide handmatige QA of end to end tests, maar biedt een snelle en consistente manier om veelvoorkomende functionele problemen automatisch te detecteren, vooral op marketing- en conversiepagina’s.

Dit project bevindt zich in actieve ontwikkeling en vormt een technische basis die stap voor stap verder wordt uitgebreid.
