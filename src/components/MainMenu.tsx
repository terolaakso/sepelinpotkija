import { Link } from 'react-router-dom';

function MainMenu() {
  return (
    <div className="h-screen bg-gray-900 text-gray-300 p-4">
      <p className="mb-2">
        Sepelinpotkija on edistyksellinen junaliikenteen seurantatyökalu. Se on tarkoitettu
        rautatieharrastajalle tai junamatkustajalle, joka haluaa tietää vastauksen kysymykseen
        &quot;mitä on tapahtumassa juuri nyt&quot;.
      </p>
      <ul>
        <li className="mb-2">
          <Link to="/juna">
            <strong>Junan seuranta</strong> -osio on tarkoitettu yksittäisen junan seuraamiseen sen
            ollessa kulussa.
          </Link>
        </li>
        <li className="mb-2">
          <Link to="/asema">
            <strong>Asema-aikataulu</strong> tarjoaa reaaliaikaisen aikataulun liikennepaikan
            saapuvista, lähtevistä ja ohittavista junista.
          </Link>
        </li>
        <li className="mb-2">
          <Link to="/linja">
            <strong>Linja-aikataulu</strong> tarjoaa reaaliaikaisen aikataulun linjalle kahden
            liikennepaikan välille.
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default MainMenu;
