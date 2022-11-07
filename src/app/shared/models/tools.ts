export interface Tools{
  id: number;
  loginAccess: boolean;
  image: string;
  url: string;
  shortDescription: string;
  longDescription: string;
  wurl: boolean;
  name: string;
}

export class Tools extends Object {
  constructor(
    public id: number,
    public name: string,
    public hasLogin: boolean,
    public url: string,
    public shortDescription: string,
    public longDescription: string,
    public image: string,
    public wurl: boolean,
    public countries: any[],
    public typologies: any[],
    public profiles: any[],
    public solutions: any[],
    public steps: any[],
    public stops: any[]
  ) {
    super();
  }
}
