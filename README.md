# Sepelinpotkija

www.sepelinpotkija.fi

Sepelinpotkija on edistyksellinen junaliikenteen seurantatyökalu. Se on tarkoitettu rautatieharrastajalle tai junamatkustajalle, joka haluaa tietää vastauksen kysymykseen "mitä nyt on tapahtumassa". Se ei siis tarjoa tietoa historiasta tai tulevasta muutamaa minuuttia tai tuntia pidemmältä ajalta.

## Junan seuranta

www.sepelinpotkija.fi/juna

Junan seuranta -toiminto on tarkoitettu junassa matkustavalle henkilölle. Digitraffic tarjoaa junan aikataulun ja kulkutiedot liikennepaikkatasolla. Digitraffic tarjoaa myös kuljettajan päätelaitteesta peräisin olevat GPS:ään pohjautuvat junan nopeus- ja sijaintitiedot muutaman sekunnin välein. Sepelinpotkija yhdistää nämä tiedot ja laskee tarkemmat arvioidut saapumisajat seuraaville liikennepaikoille.

Digitrafficin GPS-tieto on usein altis häiriöille. Kun Sepelinpotkija tunnistaa tällaisen tilanteen, se käynnistää käyttäjän laitteen sijaintiin perustuvan sijainninseurannan, jolloin tarkka kulunseuranta on jälleen mahdollista.

Ylipäätään Digitrafficin tarjoamat tiedot ovat usein ristiriitaisia tai puutteellisia, ja Sepelinpotkija sisältää monia logiikoita virhetilanteiden oikomiseen.

Junan seuranta näyttää seuraavat tapahtumat:

- Kaupallinen pysähdys (punainen pallo)
- Muu liikennepaikka (keltainen pallo)
- Toinen juna (sinivihreä pallo), ts. junakohtaus tai ohitus.
- Muu radanvarren kohde (vihreä pallo). Nämä ovat esimerkiksi vanhoja lakkautettuja asemia tai seisakkeita, merkittäviä siltoja tai tunneleita. Tietolähteenä on [ratainfo.json](https://www.sepelinpotkija.fi/ratainfo.json)-tiedosto, jota ylläpidetään osana Sepelinpotkijaa. Tietoja lisätään ja täydennetään pikku hiljaa.

Niistä liikennepaikoista tai muista kohteista, joista löytyy suomenkielinen Wikipedia-sivu, näytetään kyseinen sivu junan ohittaessa kohdetta. Linkkejä Wikipediaan ylläpidetään [ratainfo.json](https://www.sepelinpotkija.fi/ratainfo.json)-tiedostossa.

## Asema-aikataulu

www.sepelinpotkija.fi/asema

Digitrafficin dataan perustuvia asema-aikatauluja on netti pullollaan, mutta mikään niistä ei vastannut kysymykseen "mitä nyt on tapahtumassa", ja tarkemmin "mitä juuri tapahtui" tai "mitä tapahtuu seuraavaksi" aseman koko junaliikenteen osalta. Sepelinpotkija tarjoaa vastauksen. Digitrafficin tietojen ristiriitaisuuksia ja puutteita korjataan monilla Sepelinpotkijan logiikoilla. Lisäksi jos Sepelinpotkija havaitsee tilanteen, jossa aikataulun toteumatieto puuttuu, vaikka sellainen pitäisi arvioiden mukaan olla saatavilla, pyritään tilanne korjaamaan laskemalla tarkemmat aikatauluarviot junan GPS-sijainnin perusteella.

## Linja-aikataulu

www.sepelinpotkija.fi/linja

Linja-aikataulu on kuten asema-aikataulu, paitsi että se näyttää aikataulun halutussa kohtaa "linjalla", eli kahden peräkkäisen liikennepaikan välissä. Käytännön junabongausta helpottamaan linjan pisteen valitsemiseen voi käyttää käyttäjän senhetkistä sijaintia.
