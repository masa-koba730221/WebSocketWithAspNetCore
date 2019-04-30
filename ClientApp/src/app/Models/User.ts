export class User {
    public name: string;
    public password: string;

    constructor(name: string, password: string) {
        this.name = name;
        this.password = password;
    }

    public get Name(): string {
        return this.name;
    }
    public set Name(name: string) {
        this.name = name;
    }

    public get Password(): string {
        return this.password;
    }
    public set Password(password: string) {
        this.password = password;
    }
}