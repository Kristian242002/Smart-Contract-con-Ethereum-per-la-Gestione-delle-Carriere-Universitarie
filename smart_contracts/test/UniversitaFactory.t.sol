// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../contracts/UniversitaFactory.sol";
import "../contracts/CarrieraStudente.sol";
import {Test} from "forge-std/Test.sol";

contract UniversitaFactoryTest is Test {

    UniversitaFactory factory;
    address segreteria = makeAddr("segreteria");
    address universita = makeAddr("universita");
    address studente1  = makeAddr("studente1");
    address studente2  = makeAddr("studente2");
    address studente3  = makeAddr("studente3");

    function setUp() public {
        factory = new UniversitaFactory(segreteria, universita);
    }

    // ─── creaCarriera ────────────────────────────────────────────

    function test_UniversitaCreaCarriera() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1);
        assertTrue(carrieraAddr != address(0));
    }

    function test_CarrieraAssociataCorrettamente() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1);
        assertEq(factory.getCarriera(studente1), carrieraAddr);
    }

    function test_NumeroStudentiIncrementa() public {
        vm.prank(universita);
        factory.creaCarriera(studente1);
        vm.prank(universita);
        factory.creaCarriera(studente2);
        assertEq(factory.numeroStudenti(), 2);
    }

    function test_SoloDaUniversitaError() public {
        vm.prank(segreteria);
        vm.expectRevert();
        factory.creaCarriera(studente1);
    }

    function test_EstraneoError() public {
        vm.prank(studente3);
        vm.expectRevert();
        factory.creaCarriera(studente1);
    }

    function test_CarriearaDoppiaError() public {
        vm.prank(universita);
        factory.creaCarriera(studente1);
        vm.prank(universita);
        vm.expectRevert();
        factory.creaCarriera(studente1);
    }

    function test_IndirizzoZeroError() public {
        vm.prank(universita);
        vm.expectRevert();
        factory.creaCarriera(address(0));
    }

    // ─── getCarriera ─────────────────────────────────────────────

    function test_GetCarrieraStudenteInesistenteError() public {
        vm.expectRevert();
        factory.getCarriera(studente1);
    }

    function test_CarrieraCreataAppartieneAStudente() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1);
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertEq(carriera.studente(), studente1);
    }

    // ─── verifica ruoli sulla carriera ───────────────────────────

    function test_SegreteriaHaAdminRoleSuCarriera() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1);
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertTrue(carriera.hasRole(carriera.DEFAULT_ADMIN_ROLE(), segreteria));
    }

    function test_UniversitaHaAdminRoleSuCarriera() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1);
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertTrue(carriera.hasRole(carriera.DEFAULT_ADMIN_ROLE(), universita));
    }

    function test_StudenteHaStudenteRoleSuCarriera() public {
        vm.prank(universita);
        address carrieraAddr = factory.creaCarriera(studente1);
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertTrue(carriera.hasRole(carriera.STUDENTE_ROLE(), studente1));
    }
}