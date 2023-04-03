export type EnergyInfo = {
  systemId: string
  dhwDemand: number // kWh/m2/yr
  spaceHeatingDemand: number // kWh/m2/yr
  totalHeatingDemand: number // kWh/m2/yr
  freshAirRequirement: number // m3
  operationalCo2: number // kg/m2/yr
  primaryEnergyDemand: number // kWh/m2/yr
  generationEnergy: number // kWh/m2/yr
  electricityTariff: number // EUR
  glazingUValue: number
  wallUValue: number
  floorUValue: number
  roofUValue: number
}
