// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/CarrieraStudente.sol";
import "../contracts/Corso.sol";
import "../contracts/CarrieraStudenteFactory.sol";
import "../contracts/Universita.sol";

contract UniversitaTest is Test {

    Universita universita;

    address segreteria  = address(0x1);
    address professore1 = address(0x2);
    address professore2 = address(0x3);
    address studente1   = address(0x4);
    address studente2   = address(0x5);
    address estraneo    = address(0x6);

    bytes32 public constant SEGRETERIA_ROLE = keccak256("SEGRETERIA_ROLE");

    function setUp() public {
        universita = new Universita(segreteria);
    }

    // ─── costruttore ─────────────────────────────────────────────

    function test_costruttore() public view {
        assertTrue(universita.hasRole(SEGRETERIA_ROLE, segreteria));
        assertTrue(address(universita.factory()) != address(0));
    }

    function test_costruttore_segreteriaHulla() public {
        vm.expectRevert("Indirizzo segreteria non valido");
        new Universita(address(0));
    }

    // ─── aggiungiProfessore ──────────────────────────────────────

    function test_aggiungiProfessore() public {
        vm.prank(segreteria);
        universita.aggiungiProfessore(professore1);
        assertTrue(universita.isProfessore(professore1));
    }

    function test_aggiungiProfessore_soloSegreteria() public {
        vm.prank(estraneo);
        vm.expectRevert();
        universita.aggiungiProfessore(professore1);
    }

    function test_aggiungiProfessore_giaRegistrato() public {
        vm.prank(segreteria);
        universita.aggiungiProfessore(professore1);
        vm.prank(segreteria);
        vm.expectRevert("Professore gia' registrato");
        universita.aggiungiProfessore(professore1);
    }

    function test_aggiungiProfessore_indirizzoNullo() public {
        vm.prank(segreteria);
        vm.expectRevert("Indirizzo professore non valido");
        universita.aggiungiProfessore(address(0));
    }

    // ─── rimuoviProfessore ───────────────────────────────────────

    function test_rimuoviProfessore() public {
        vm.prank(segreteria);
        universita.aggiungiProfessore(professore1);
        vm.prank(segreteria);
        universita.rimuoviProfessore(professore1);
        assertFalse(universita.isProfessore(professore1));
    }

    function test_rimuoviProfessore_soloSegreteria() public {
        vm.prank(segreteria);
        universita.aggiungiProfessore(professore1);
        vm.prank(estraneo);
        vm.expectRevert();
        universita.rimuoviProfessore(professore1);
    }

    function test_rimuoviProfessore_nonRegistrato() public {
        vm.prank(segreteria);
        vm.expectRevert("Professore non registrato");
        universita.rimuoviProfessore(professore1);
    }

    // ─── registraStudente ────────────────────────────────────────

    function test_registraStudente() public {
        vm.prank(segreteria);
        universita.registraStudente(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        address carriera = universita.getCarrieraStudente(studente1);
        assertTrue(carriera != address(0));
    }

    function test_registraStudente_soloSegreteria() public {
        vm.prank(estraneo);
        vm.expectRevert();
        universita.registraStudente(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
    }

    function test_registraStudente_giaRegistrato() public {
        vm.prank(segreteria);
        universita.registraStudente(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        vm.prank(segreteria);
        vm.expectRevert("Carriera gia' esistente per questo studente");
        universita.registraStudente(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
    }

    function test_registraStudente_tipoLaurea_magistrale() public {
        vm.prank(segreteria);
        universita.registraStudente(studente1, CarrieraStudente.TipoLaurea.MAGISTRALE, "Luigi", "Bianchi");
        address carrieraAddr = universita.getCarrieraStudente(studente1);
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertEq(uint(carriera.tipoLaurea()), uint(CarrieraStudente.TipoLaurea.MAGISTRALE));
    }

    function test_registraStudente_nomeCognomeSalvati() public {
        vm.prank(segreteria);
        universita.registraStudente(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        address carrieraAddr = universita.getCarrieraStudente(studente1);
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertEq(carriera.nome(), "Mario");
        assertEq(carriera.cognome(), "Rossi");
    }

    // ─── creaCorso ───────────────────────────────────────────────

    function test_creaCorso() public {
        vm.prank(segreteria);
        universita.aggiungiProfessore(professore1);
        vm.prank(segreteria);
        address corsoAddr = universita.creaCorso("Matematica", 6, 30, professore1);

        assertTrue(corsoAddr != address(0));
        assertEq(universita.getListaCorsi().length, 1);

        Corso corso = Corso(corsoAddr);
        assertEq(corso.nome(), "Matematica");
        assertEq(corso.professore(), professore1);
    }

    function test_creaCorso_soloSegreteria() public {
        vm.prank(segreteria);
        universita.aggiungiProfessore(professore1);
        vm.prank(estraneo);
        vm.expectRevert();
        universita.creaCorso("Matematica", 6, 30, professore1);
    }

    function test_creaCorso_professoreNonRegistrato() public {
        vm.prank(segreteria);
        vm.expectRevert("Il professore non e' registrato nell'universita'");
        universita.creaCorso("Matematica", 6, 30, professore1);
    }

    // ─── iscriviStudenteACorso ───────────────────────────────────

    function _setupBase() internal returns (address) {
        vm.prank(segreteria);
        universita.aggiungiProfessore(professore1);
        vm.prank(segreteria);
        universita.registraStudente(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        vm.prank(segreteria);
        address corsoAddr = universita.creaCorso("Matematica", 6, 30, professore1);
        return corsoAddr;
    }

    function test_iscriviStudenteACorso() public {
        address corsoAddr = _setupBase();
        vm.prank(segreteria);
        universita.iscriviStudenteACorso(studente1, corsoAddr);
        Corso corso = Corso(corsoAddr);
        assertTrue(corso.isStudenteIscritto(studente1));
    }

    function test_iscriviStudenteACorso_soloSegreteria() public {
        address corsoAddr = _setupBase();
        vm.prank(estraneo);
        vm.expectRevert();
        universita.iscriviStudenteACorso(studente1, corsoAddr);
    }

    function test_iscriviStudenteACorso_studenteNonRegistrato() public {
        address corsoAddr = _setupBase();
        vm.prank(segreteria);
        vm.expectRevert("Nessuna carriera trovata per questo studente");
        universita.iscriviStudenteACorso(studente2, corsoAddr);
    }

    // ─── get ─────────────────────────────────────────────────────

    function test_getListaCorsi() public {
        vm.prank(segreteria);
        universita.aggiungiProfessore(professore1);
        vm.prank(segreteria);
        universita.creaCorso("AnalisiI", 6, 30, professore1);
        vm.prank(segreteria);
        universita.creaCorso("FisicaI", 6, 30, professore1);
        address[] memory corsi = universita.getListaCorsi();
        assertEq(corsi.length, 2);
    }

    function test_getListaProfessori() public {
        vm.prank(segreteria);
        universita.aggiungiProfessore(professore1);
        vm.prank(segreteria);
        universita.aggiungiProfessore(professore2);
        address[] memory profs = universita.getListaProfessori();
        assertEq(profs.length, 2);
        assertEq(profs[0], professore1);
        assertEq(profs[1], professore2);
    }

    function test_getCarrieraStudente() public {
        vm.prank(segreteria);
        universita.registraStudente(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        address carriera = universita.getCarrieraStudente(studente1);
        assertTrue(carriera != address(0));
        CarrieraStudente cs = CarrieraStudente(carriera);
        assertEq(cs.studente(), studente1);
    }

    // ─── getQRCode ───────────────────────────────────────────────

    function test_getQRCode() public {
        vm.prank(segreteria);
        universita.registraStudente(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        CarrieraStudente.StudenteInfo memory info = universita.getQRCode(studente1);
        assertEq(info.wallet, studente1);
        assertEq(info.nome, "Mario");
        assertEq(info.cognome, "Rossi");
        assertEq(uint(info.tipoLaurea), uint(CarrieraStudente.TipoLaurea.TRIENNALE));
        assertEq(info.cfuTotali, 0);
        assertEq(info.laureato, false);
    }

    function test_getQRCode_studenteInesistente() public {
        vm.expectRevert("Nessuna carriera trovata per questo studente");
        universita.getQRCode(studente1);
    }

    // ─── flusso completo ─────────────────────────────────────────

    function test_flussoCompleto() public {
        // aggiungi professore
        vm.prank(segreteria);
        universita.aggiungiProfessore(professore1);

        // registra studente
        vm.prank(segreteria);
        universita.registraStudente(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");

        // crea corso
        vm.prank(segreteria);
        address corsoAddr = universita.creaCorso("AnalisiI", 6, 30, professore1);
        Corso corso = Corso(corsoAddr);

        // iscrivi studente al corso
        vm.prank(segreteria);
        universita.iscriviStudenteACorso(studente1, corsoAddr);

        // chiudi iscrizioni
        vm.prank(segreteria);
        universita.chiudiIscrizioniCorso(corsoAddr);

        // registra voto
        vm.prank(professore1);
        corso.registraVoto(studente1, 18, false);

        // verifica sulla carriera
        address carrieraAddr = universita.getCarrieraStudente(studente1);
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);

        assertEq(carriera.getNumeroEsami(), 1);
        CarrieraStudente.Esame memory esame = carriera.getEsame(0);
        assertEq(esame.voto, 18);
        assertEq(esame.nome, "AnalisiI");

        // verifica QR code
        CarrieraStudente.StudenteInfo memory info = universita.getQRCode(studente1);
        assertEq(info.nome, "Mario");
        assertEq(info.cognome, "Rossi");
        assertEq(uint(info.tipoLaurea), uint(CarrieraStudente.TipoLaurea.TRIENNALE));
    }
    // ─── registraVoto ────────────────────────────────────────────

    function test_registraVoto_dalProfessore() public {
        address corsoAddr = _setupBase();
        vm.prank(segreteria);
        universita.iscriviStudenteACorso(studente1, corsoAddr);
        vm.prank(segreteria);
        universita.chiudiIscrizioniCorso(corsoAddr);
        vm.prank(professore1);
        universita.registraVoto(corsoAddr, studente1, 28, false);
        address carrieraAddr = universita.getCarrieraStudente(studente1);
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertEq(carriera.getNumeroEsami(), 1);
    }

    function test_registraVoto_dallaSegreteria() public {
        address corsoAddr = _setupBase();
        vm.prank(segreteria);
        universita.iscriviStudenteACorso(studente1, corsoAddr);
        vm.prank(segreteria);
        universita.chiudiIscrizioniCorso(corsoAddr);
        vm.prank(segreteria);
        universita.registraVoto(corsoAddr, studente1, 25, false);
        address carrieraAddr = universita.getCarrieraStudente(studente1);
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertEq(carriera.getNumeroEsami(), 1);
    }

    function test_registraVoto_estraneoError() public {
        address corsoAddr = _setupBase();
        vm.prank(segreteria);
        universita.iscriviStudenteACorso(studente1, corsoAddr);
        vm.prank(segreteria);
        universita.chiudiIscrizioniCorso(corsoAddr);
        vm.prank(estraneo);
        vm.expectRevert("Solo il professore o la segreteria possono eseguire questa operazione");
        universita.registraVoto(corsoAddr, studente1, 28, false);
    }
}