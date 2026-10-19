#!/bin/bash
set -e

DIR="assets/video_audio"
mkdir -p "$DIR"

# French (Thomas)
VOICE_FR="Thomas"
say -v "$VOICE_FR" -r 170 "Vous suivez encore les présences avec des feuilles papier, des badges perdus ou du matériel coûteux ? C'est lent, source d'erreurs et cela coûte des milliers d'euros chaque mois." -o "$DIR/scene1_fr.m4a"
say -v "$VOICE_FR" -r 170 "Découvrez GetApp Smart QR : la solution moderne qui transforme toute tablette standard en borne d'entrée intelligente. Rapide, fluide et sans fraude." -o "$DIR/scene2_fr.m4a"
say -v "$VOICE_FR" -r 170 "Suivez vos équipes sur tous vos sites en temps réel. Filtrez les présences directement depuis les graphiques et laissez la clôture automatique des shifts finaliser les départs." -o "$DIR/scene3_fr.m4a"
say -v "$VOICE_FR" -r 170 "En fin de mois, exportez vos feuilles d'heures certifiées en un clic. Et avec nos codes QR dynamiques chiffrés, vous êtes 100 % conforme au RGPD sans données biométriques." -o "$DIR/scene4_fr.m4a"
say -v "$VOICE_FR" -r 170 "Aucun coût matériel propriétaire. Déployez en seulement 15 minutes pour 15 euros par employé et par mois avec le forfait Smart." -o "$DIR/scene5_fr.m4a"
say -v "$VOICE_FR" -r 170 "Modernisez votre pointage dès aujourd'hui. Rendez-vous sur www.getapp.ro pour profiter de 14 jours d'essai gratuit." -o "$DIR/scene6_fr.m4a"

# Dutch (Ellen or Xander)
VOICE_NL="Ellen"
say -v "$VOICE_NL" -r 170 "Registreert u de aanwezigheid nog met papieren lijsten of verloren pasjes? Dit kost veel tijd, leidt tot fouten en kost uw bedrijf maandelijks duizenden euro's." -o "$DIR/scene1_nl.m4a"
say -v "$VOICE_NL" -r 170 "Ontdek GetApp Smart QR: het moderne platform dat van elke standaard tablet een slimme aanwezigheidskiosk maakt. Snel, veilig en betrouwbaar." -o "$DIR/scene2_nl.m4a"
say -v "$VOICE_NL" -r 170 "Beheer uw personeel overal in real-time. Filter direct via interactieve grafieken en laat de automatische shift-afsluiting vergeten uitklokkingen afronden." -o "$DIR/scene3_nl.m4a"
say -v "$VOICE_NL" -r 170 "Exporteer aan het einde van de maand gecertificeerde urenstaten in één klik. Volledig AVG-conform, zonder invasieve biometrie." -o "$DIR/scene4_nl.m4a"
say -v "$VOICE_NL" -r 170 "Geen dure hardware nodig. Binnen 15 minuten operationeel voor slechts 15 euro per medewerker per maand met het Smart-abonnement." -o "$DIR/scene5_nl.m4a"
say -v "$VOICE_NL" -r 170 "Upgrade uw tijdregistratie vandaag nog. Bezoek www.getapp.ro en start uw gratis proefperiode van 14 dagen." -o "$DIR/scene6_nl.m4a"

echo "Multi-language voiceovers generated successfully!"
