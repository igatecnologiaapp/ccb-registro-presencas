import { describe, it, expect } from "vitest";
import { buildReport, buildTrainingReport, isValidCpf, ageFrom } from "@/lib/report";

const fn = (id:string,name:string)=>({id,name,active:true,created_at:"",updated_at:""});
const inst = (id:string,name:string,shared=false)=>({...fn(id,name),is_shared:shared});
const house = (id:string,name:string,sector_id:string|null=null,active=true)=>({...fn(id,name),active,code:null,sector_id});
const sec = (id:string,name:string,order:number,active=true)=>({...fn(id,name),active,code:null,display_order:order});
const att=(id:string,h:string,f:string,i:string|null)=>({id,event_id:"e",name:"n"+id,prayer_house_id:h,function_id:f,instrument_id:i,created_at:""});

describe("regra do ÓRGÃO", () => {
  it("conta 5 participantes e 1 instrumento", () => {
    const r = buildReport(
      [1,2,3,4,5].map(n=>att(String(n),"h1","f1","i1")),
      [fn("f1","ORGANISTA")],[inst("i1","ÓRGÃO",true)],[house("h1","CASA 1")],[]);
    expect(r.total).toBe(5);
    expect(r.withInstrument).toBe(5);
    expect(r.instrumentRanking[0]!.count).toBe(5);
    expect(r.instrumentRanking[0]!.instruments).toBe(1);
    expect(r.totalInstruments).toBe(1);
  });
  it("instrumento normal conta 1 por participante", () => {
    const r = buildReport(
      [1,2,3].map(n=>att(String(n),"h1","f1","i2")),
      [fn("f1","MÚSICO")],[inst("i2","VIOLINO")],[house("h1","C")],[]);
    expect(r.totalInstruments).toBe(3);
  });
});

describe("casas e setores", () => {
  it("presentes/ausentes e ordem dos setores", () => {
    const houses=[house("h1","A","s2"),house("h2","B","s1"),house("h3","C",null),house("h4","D","s1"),house("h5","E","s1",false)];
    const sectors=[sec("s1","SETOR UM",1),sec("s2","SETOR DOIS",2)];
    const r=buildReport([att("1","h2","f1",null),att("2","h1","f1",null)],[fn("f1","F")],[],houses,sectors);
    expect(r.activeHouses).toBe(4);
    expect(r.presentHouses.map(p=>p.name)).toEqual(["A","B"]);
    expect(r.absentHouses).toEqual(["C","D"]);
    expect(r.sectors.map(s=>s.name)).toEqual(["SETOR UM","SETOR DOIS","Sem setor"]);
    const s1=r.sectors[0]!;
    expect(s1.totalHouses).toBe(2); expect(s1.present).toBe(1); expect(s1.absent).toBe(1);
    const sum=r.sectors.reduce((a,s)=>a+s.totalHouses,0);
    expect(sum).toBe(r.activeHouses);
  });
  it("casa de setor desativado continua no resumo", () => {
    const houses=[house("h1","A","s1")];
    const sectors=[sec("s1","SETOR OFF",1,false)];
    const r=buildReport([att("1","h1","f1",null)],[fn("f1","F")],[],houses,sectors);
    const sum=r.sectors.reduce((a,s)=>a+s.totalHouses,0);
    expect(sum).toBe(1);
  });
});

describe("treinamento", () => {
  it("idade média e ranking por congregação", () => {
    const rows=[
      {id:"1",event_id:"e",prayer_house_id:"h1",full_name:"A",cpf:"11144477735",birth_date:"2000-01-01",function_id:"f1",created_at:""},
      {id:"2",event_id:"e",prayer_house_id:"h1",full_name:"B",cpf:"11144477735",birth_date:"1990-01-01",function_id:"f1",created_at:""},
    ];
    const r=buildTrainingReport(rows,[fn("f1","MÚSICO")],[house("h1","CASA"),house("h2","OUTRA")],[]);
    expect(r.total).toBe(2);
    expect(r.presentHouses[0]!.count).toBe(2);
    expect(r.absentHouses).toEqual(["OUTRA"]);
    expect(Math.round(r.averageAge)).toBe(Math.round((ageFrom("2000-01-01")+ageFrom("1990-01-01"))/2));
  });
  it("valida CPF", () => {
    expect(isValidCpf("111.444.777-35")).toBe(true);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });
});
