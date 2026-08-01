import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("UniversitaModule", (m) => {
  const segreteria = m.getAccount(0);

  const universita = m.contract("Universita", [segreteria]);

  return { universita };
});
