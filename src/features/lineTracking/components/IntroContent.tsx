export default function IntroContent() {
  return (
    <div className="overflow-y-auto">
      <p>
        Linja-aikataululla voi hakea ajantasaisen aikataulun liikennepaikkojen välille.
        Liikennepaikkojen on oltava peräkkäiset. Sijainti liikennepaikkojen välillä valitaan
        liukusäätimellä.
      </p>
      <p>
        Käytä nykyistä sijaintia -toiminnolla ohjelma päättelee sijaintisi rataverkolla laitteesi
        antamien sijaintitietojen perusteella automaattisesti.
      </p>
      <p>
        Myöhässä kulkevista junista näytetään saatavilla olevat myöhässäkulun syyt. Jos kulkutiedot
        eivät päivity lähdejärjestelmään ajallaan, lasketaan junan aikataululle arvio junan
        senhetkisen GPS-sijainnin perusteella. Aikataulu päivittyy reaaliajassa.
      </p>
    </div>
  );
}
