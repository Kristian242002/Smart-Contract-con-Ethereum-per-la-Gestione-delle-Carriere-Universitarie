// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../contracts/CarrieraStudenteFactory.sol";
import "../contracts/CarrieraStudente.sol";
import {Test} from "forge-std/Test.sol";

contract CarrieraStudenteFactoryTest is Test {

    CarrieraStudenteFactory factory;
    address segreteria = makeAddr("segreteria");
    address universita = makeAddr("universita");
    address studente1  = makeAddr("studente1");
    address studente2  = makeAddr("studente2");
    address studente3  = makeAddr("studente3");

    bytes32 public constant STUDENTE_ROLE = keccak256("STUDENTE_ROLE");
    bytes32 public constant CORSO_ROLE    = keccak256("CORSO_ROLE");

    function setUp() public {
        factory = new CarrieraStudenteFactory(segreteria, universita, STUDENTE_ROLE, CORSO_ROLE);
    }

    // ─── creaCarriera ────────────────────────────────────────────

    function test_UniversitaCreaCarriera() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        assertTrue(carrieraAddr != address(0));
    }

    function test_CarrieraAssociataCorrettamente() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        assertEq(factory.getCarriera(studente1), carrieraAddr);
    }

    function test_NumeroStudentiIncrementa() public {
        vm.prank(universita);
        factory.creaCarriera(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        vm.prank(universita);
        factory.creaCarriera(studente2, CarrieraStudente.TipoLaurea.MAGISTRALE, "Luigi", "Bianchi");
        assertEq(factory.numeroStudenti(), 2);
    }

    function test_SoloDaUniversitaError() public {
        vm.prank(segreteria);
        vm.expectRevert();
        factory.creaCarriera(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
    }

    function test_EstraneoError() public {
        vm.prank(studente3);
        vm.expectRevert();
        factory.creaCarriera(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
    }

    function test_CarrieraDoppiaError() public {
        vm.prank(universita);
        factory.creaCarriera(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        vm.prank(universita);
        vm.expectRevert();
        factory.creaCarriera(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
    }

    function test_IndirizzoZeroError() public {
        vm.prank(universita);
        vm.expectRevert();
        factory.creaCarriera(address(0), CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
    }

    // ─── getCarriera ─────────────────────────────────────────────

    function test_GetCarrieraStudenteInesistenteError() public {
        vm.expectRevert();
        factory.getCarriera(studente1);
    }

    function test_CarrieraCreataAppartieneAStudente() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertEq(carriera.studente(), studente1);
    }

    // ─── verifica tipo laurea ─────────────────────────────────────

    function test_TipoLaurea_triennale() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertEq(uint(carriera.tipoLaurea()), uint(CarrieraStudente.TipoLaurea.TRIENNALE));
    }

    function test_TipoLaurea_magistrale() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1, CarrieraStudente.TipoLaurea.MAGISTRALE, "Mario", "Rossi");
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertEq(uint(carriera.tipoLaurea()), uint(CarrieraStudente.TipoLaurea.MAGISTRALE));
    }

    // ─── verifica nome e cognome ──────────────────────────────────

    function test_NomeCognomeSalvatiCorrettamente() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertEq(carriera.nome(), "Mario");
        assertEq(carriera.cognome(), "Rossi");
    }

    // ─── verifica ruoli sulla carriera ───────────────────────────

    function test_SegreteriaHaAdminRoleSuCarriera() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertTrue(carriera.hasRole(carriera.DEFAULT_ADMIN_ROLE(), segreteria));
    }

    function test_UniversitaHaAdminRoleSuCarriera() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertTrue(carriera.hasRole(carriera.DEFAULT_ADMIN_ROLE(), universita));
    }

    function test_StudenteHaStudenteRoleSuCarriera() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertTrue(carriera.hasRole(carriera.STUDENTE_ROLE(), studente1));
    }
}