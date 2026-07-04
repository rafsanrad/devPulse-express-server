export interface IUser{
    name:string,
    email:string,
    password:string,
    age:number,
    is_active?:boolean,
    role?:string, //admin,agent,user=> enum diye kora bhalo.
}