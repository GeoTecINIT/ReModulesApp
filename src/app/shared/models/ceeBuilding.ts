export interface CeeBuilding  {
    address: string,
    addressmap: string,
    rc: string,
    typology: string,
    case_building: string,
    year: string,
    year_certificate: number,
    letter_co2: string,
    value_co2: number,
    letter_ep: string,
    value_ep: number,
    year_certificate2: number,
    letter_co2_cert2: string,
    value_co2_cert2: number,
    letter_ep_cert2: string,
    value_ep_cert2: number,
    saving_co2_abs: number,
    saving_co2_perc: number,
    saving_ep_abs: number,
    saving_ep_perc: number
    id: number;
    coordinates: { lng: any | number; lat: any };
    point: { x: any; y: any};
  }

export class ceeBuilding extends Object {
    constructor(
        public address: string,
        public addressmap: string,
        public rc: string,
        public typology: string,
        public case_building: string,
        public year: string,
        public year_certificate: number,
        public letter_co2: string,
        public value_co2: number,
        public letter_ep: string,
        public value_ep: number,
        public year_certificate2: number,
        public letter_co2_cert2: string,
        public value_co2_cert2: number,
        public letter_ep_cert2: string,
        public value_ep_cert2: number,
        public saving_co2_abs: number,
        public saving_co2_perc: number,
        public saving_ep_abs: number,
        public saving_ep_perc: number,
        public coordinates: { lng: any | number; lat: any },
        public point: { x: any; y: any}
    ) {
      super();
    }
  }