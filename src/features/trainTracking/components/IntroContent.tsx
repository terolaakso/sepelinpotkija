export default function IntroContent() {
  return (
    <div className="overflow-y-auto">
      <p className="mb-2">
        Junan seuranta -työkalulla seurataan junan kulkua reaaliajassa. Syötä seurattavan junan
        numero yläreunan kenttään.
      </p>
      <p>
        Näytettäviä kulkutietoja ovat pysähdykset, liikennepaikkojen ohitukset ja kohtaamiset muiden
        junien kanssa. Myöhässä kulkevista junista näytetään saatavilla olevat myöhässäkulun syyt.
        Jos kulkutiedot eivät päivity lähdejärjestelmään ajallaan, lasketaan junan aikataululle
        arvio junan senhetkisen GPS-sijainnin perusteella. Valituilta rataosilta näytetään
        edellämainittujen tietojen lisäksi historialliset liikennepaikat ja mahdolliset muut
        kiinnostavat radanvarren kohteet. Jos kohteesta on saatavilla Wikipedia-artikkeli, näytetään
        artikkelin sisältö junan kulkiessa kohteen ohi. Koska historiallisten liikennepaikkojen ja
        Wikipedian tietojen linkittäminen Digitrafficin tarjoamaan dataan on manuaalista työtä,
        tulee tarkempia tietoja saataville pikku hiljaa. Tällä hetkellä tarkempia tietoja on
        saatavilla seuraavilta rataosilta:
      </p>
      <small>
        <ul className="ml-2">
          <li>Helsinki - Turku</li>
          <li>Helsinki - Tampere</li>
          <li>Toijala - Valkeakoski</li>
          <li>Kerava - Porvoo</li>
          <li>Hyvinkää - Hanko</li>
          <li>Toijala - Turku</li>
          <li>Turku - Hangonsaari</li>
          <li>Raisio - Naantali</li>
          <li>Tampere - Vammala</li>
          <li>Harjavalta - Mäntyluoto</li>
          <li>Seinäjoki - Raunio</li>
          <li>Ylivieska - Oulu</li>
          <li>Tuomioja - Raahe</li>
          <li>Seinäjoki - Kaskinen</li>
          <li>Seinäjoki - Vaasa</li>
          <li>Tampere - Orivesi</li>
          <li>Jyväskylä - Pieksämäki</li>
          <li>Orivesi - Seinäjoki</li>
          <li>Haapamäki - Jyväskylä</li>
          <li>Jyväskylä - Saarijärvi</li>
          <li>Oulu - Laurila</li>
          <li>Laurila - Haaparanta</li>
          <li>Riihimäki - Kouvola</li>
          <li>Kytömaa - Lahti</li>
          <li>Lahti - Loviisan satama</li>
          <li>Lahti - Heinola</li>
          <li>Kouvola - Siilinjärvi</li>
          <li>Kontiomäki - Murtomäki</li>
          <li>Ylivieska - Iisalmi</li>
          <li>Lappeenranta - Joutseno</li>
          <li>Imatra - Parikkala</li>
          <li>Lappeenranta - Mustolan satama</li>
          <li>Parikkala - Savonlinna</li>
          <li>Nurmes - Valtimo</li>
          <li>Kontiomäki - Oulu</li>
          <li>Kontiomäki - Ämmänsaari</li>
        </ul>
      </small>
    </div>
  );
}
