// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/CarrieraStudente.sol";
import "../contracts/Corso.sol";

contract CorsoTest is Test {

    Corso corso;
    CarrieraStudente carrieraStudente1;
    CarrieraStudente carrieraStudente2;

    address segreteria = address(0x1);
    address professore = address(0x2);
    address studente1  = address(0x3);
    address studente2  = address(0x4);
    address estraneo   = address(0x5);
    address universita = address(0x7);

    bytes32 public constant CORSO_ROLE = keccak256("CORSO_ROLE");

    function setUp() public {
        corso = new Corso("Analisi I", 6, 2, professore, segreteria, universita);
        carrieraStudente1 = new CarrieraStudente(studente1, segreteria, universita);
        carrieraStudente2 = new CarrieraStudente(studente2, segreteria, universita);
        vm.prank(segreteria);
        carrieraStudente1.grantRole(CORSO_ROLE, address(corso));
        vm.prank(segreteria);
        carrieraStudente2.grantRole(CORSO_ROLE, address(corso));
    }

    // ─── costruttore ─────────────────────────────────────────────

    function test_costruttore() public view {
        assertEq(corso.nome(), "Analisi I");
        assertEq(corso.cfu(), 6);
        assertEq(corso.maxStudenti(), 2);
        assertEq(corso.professore(), professore);
        assertTrue(corso.hasRole(keccak256("SEGRETERIA_ROLE"), segreteria));
        assertEq(uint(corso.getStato()), uint(Corso.StatoCorso.APERTO));
    }

    function test_costruttore_nomeVuoto() public {
        vm.expectRevert("Il nome del corso non puo' essere vuoto");
        new Corso("", 6, 2, professore, segreteria, universita);
    }

    function test_costruttore_cfuNonValidi() public {
        vm.expectRevert("CFU non validi");
        new Corso("Analisi I", 0, 2, professore, segreteria, universita);
    }

    function test_costruttore_maxStudentiZero() public {
        vm.expectRevert("Il numero massimo di studenti deve essere maggiore di zero");
        new Corso("Analisi I", 6, 0, professore, segreteria, universita);
    }

    function test_costruttore_professoreNullo() public {
        vm.expectRevert("Indirizzo professore non valido");
        new Corso("Analisi I", 6, 2, address(0), segreteria, universita);
    }

    function test_costruttore_segreteriaHulla() public {
        vm.expectRevert("Indirizzo segreteria non valido");
        new Corso("Analisi I", 6, 2, professore, address(0), universita);
    }

    function test_costruttore_universitaNulla() public {
        vm.expectRevert("Indirizzo universita non valido");
        new Corso("Analisi I", 6, 2, professore, segreteria, address(0));
    }

    // ─── iscriviStudente ─────────────────────────────────────────

    function test_iscriviStudente() public {
        vm.prank(segreteria);
        corso.iscriviStudente(studente1, address(carrieraStudente1));
        assertEq(corso.numeroIscritti(), 1);
        assertTrue(corso.isStudenteIscritto(studente1));
    }

    function test_iscriviStudente_dueStudenti() public {
        vm.prank(segreteria);
        corso.iscriviStudente(studente1, address(carrieraStudente1));
        vm.prank(segreteria);
        corso.iscriviStudente(studente2, address(carrieraStudente2));
        assertEq(corso.numeroIscritti(), 2);
    }

    function test_iscriviStudente_soloSegreteria() public {
        vm.prank(estraneo);
        vm.expectRevert();
        corso.iscriviStudente(studente1, address(carrieraStudente1));
    }

    function test_iscriviStudente_soloSeAperto() public {
        vm.prank(segreteria);
        corso.chiudiIscrizioni();
        vm.prank(segreteria);
        vm.expectRevert("Operazione non consentita nello stato corrente");
        corso.iscriviStudente(studente1, address(carrieraStudente1));
    }

    function test_iscriviStudente_giaIscritto() public {
        vm.prank(segreteria);
        corso.iscriviStudente(studente1, address(carrieraStudente1));
        vm.prank(segreteria);
        vm.expectRevert("Studente gia' iscritto");
        corso.iscriviStudente(studente1, address(carrieraStudente1));
    }

    function test_iscriviStudente_maxRaggiunto() public {
        vm.prank(segreteria);
        corso.iscriviStudente(studente1, address(carrieraStudente1));
        vm.prank(segreteria);
        corso.iscriviStudente(studente2, address(carrieraStudente2));
        address studente3 = address(0x6);
        CarrieraStudente carriera3 = new CarrieraStudente(studente3, segreteria, universita);
        vm.prank(segreteria);
        vm.expectRevert("Numero massimo di studenti raggiunto");
        corso.iscriviStudente(studente3, address(carriera3));
    }

    // ─── chiudiIscrizioni ────────────────────────────────────────

    function test_chiudiIscrizioni() public {
        vm.prank(segreteria);
        corso.chiudiIscrizioni();
        assertEq(uint(corso.getStato()), uint(Corso.StatoCorso.CHIUSO));
    }

    function test_chiudiIscrizioni_soloSegreteria() public {
        vm.prank(estraneo);
        vm.expectRevert();
        corso.chiudiIscrizioni();
    }

    function test_chiudiIscrizioni_soloSeAperto() public {
        vm.prank(segreteria);
        corso.chiudiIscrizioni();
        vm.prank(segreteria);
        vm.expectRevert("Operazione non consentita nello stato corrente");
        corso.chiudiIscrizioni();
    }

    // ─── concludiCorso ───────────────────────────────────────────

    function test_concludiCorso() public {
        vm.prank(segreteria);
        corso.chiudiIscrizioni();
        vm.prank(segreteria);
        corso.concludiCorso();
        assertEq(uint(corso.getStato()), uint(Corso.StatoCorso.CONCLUSO));
    }

    function test_concludiCorso_soloSegreteria() public {
        vm.prank(segreteria);
        corso.chiudiIscrizioni();
        vm.prank(estraneo);
        vm.expectRevert();
        corso.concludiCorso();
    }

    function test_concludiCorso_soloSeChiuso() public {
        vm.prank(segreteria);
        vm.expectRevert("Operazione non consentita nello stato corrente");
        corso.concludiCorso();
    }

    // ─── registraVoto ────────────────────────────────────────────

    function _setupChiuso() internal {
        vm.prank(segreteria);
        corso.iscriviStudente(studente1, address(carrieraStudente1));
        vm.prank(segreteria);
        corso.chiudiIscrizioni();
    }

    function test_registraVoto_dalProfessore() public {
        _setupChiuso();
        vm.prank(professore);
        corso.registraVoto(studente1, 28, false);
        assertEq(carrieraStudente1.getNumeroEsami(), 1);
        CarrieraStudente.Esame memory esame = carrieraStudente1.getEsame(0);
        assertEq(esame.voto, 28);
        assertEq(esame.nome, "Analisi I");
        assertEq(esame.cfu, 6);
    }

    function test_registraVoto_dallaSegreteria() public {
        _setupChiuso();
        vm.prank(segreteria);
        corso.registraVoto(studente1, 25, false);
        assertEq(carrieraStudente1.getNumeroEsami(), 1);
    }

    function test_registraVoto_conLode() public {
        _setupChiuso();
        vm.prank(professore);
        corso.registraVoto(studente1, 30, true);
        CarrieraStudente.Esame memory esame = carrieraStudente1.getEsame(0);
        assertEq(esame.voto, 31);
    }

    function test_registraVoto_insufficiente() public {
        _setupChiuso();
        vm.prank(professore);
        corso.registraVoto(studente1, 15, false);
        CarrieraStudente.Esame memory esame = carrieraStudente1.getEsame(0);
        assertEq(esame.voto, 15);
        assertEq(uint(esame.stato), uint(CarrieraStudente.StatoEsame.INSUFFICIENTE));
    }

    function test_registraVoto_soloSeChiuso() public {
        vm.prank(segreteria);
        corso.iscriviStudente(studente1, address(carrieraStudente1));
        vm.prank(professore);
        vm.expectRevert("Operazione non consentita nello stato corrente");
        corso.registraVoto(studente1, 28, false);
    }

    function test_registraVoto_soloProfOSegreteria() public {
        _setupChiuso();
        vm.prank(estraneo);
        vm.expectRevert("Solo il professore o la segreteria possono eseguire questa operazione");
        corso.registraVoto(studente1, 28, false);
    }

    function test_registraVoto_studenteNonIscritto() public {
        _setupChiuso();
        vm.prank(professore);
        vm.expectRevert("Studente non iscritto al corso");
        corso.registraVoto(studente2, 28, false);
    }

    function test_registraVoto_votoNonValido() public {
        _setupChiuso();
        vm.prank(professore);
        vm.expectRevert("Voto non valido: deve essere tra 0 e 30");
        corso.registraVoto(studente1, 31, false);
    }

    function test_registraVoto_lodeSenzaTrenta() public {
        _setupChiuso();
        vm.prank(professore);
        vm.expectRevert("La lode e' consentita solo con voto 30");
        corso.registraVoto(studente1, 29, true);
    }

    // ─── get ─────────────────────────────────────────────────────

    function test_getIscritti() public {
        vm.prank(segreteria);
        corso.iscriviStudente(studente1, address(carrieraStudente1));
        vm.prank(segreteria);
        corso.iscriviStudente(studente2, address(carrieraStudente2));
        address[] memory lista = corso.getIscritti();
        assertEq(lista.length, 2);
        assertEq(lista[0], studente1);
        assertEq(lista[1], studente2);
    }

    function test_isStudenteIscritto_false() public view {
        assertFalse(corso.isStudenteIscritto(studente1));
    }
}