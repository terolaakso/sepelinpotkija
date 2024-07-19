import { Link } from 'react-router-dom';

function MainMenu() {
  return (
    <div className="h-dvh bg-gray-900 text-gray-300 px-1">
      <p className="mb-2">
        Sepelinpotkija on työkalu junaliikenteen reaaliaikaiseen seurantaan. Siirry seuraavista
        linkeistä haluamaasi osioon.
      </p>
      <p className="mb-2">
        <Link to="/juna">
          <strong>Junan seuranta</strong> -osio on tarkoitettu yksittäisen junan seuraamiseen sen
          ollessa kulussa.
        </Link>
      </p>
      <p className="mb-2">
        <Link to="/asema">
          <strong>Asema-aikataulu</strong> tarjoaa reaaliaikaisen aikataulun liikennepaikan
          saapuvista, lähtevistä ja ohittavista junista.
        </Link>
      </p>
      <p className="mb-2">
        {/* TODO */}
        <Link to="/">
          <strong>Linja-aikataulu</strong> tarjoaa reaaliaikaisen aikataulun linjalle kahden
          liikennepaikan välille. TODO
        </Link>
      </p>
    </div>
  );
}

export default MainMenu;
