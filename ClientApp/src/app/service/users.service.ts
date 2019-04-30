import { Injectable, Inject } from '@angular/core';
import { WebSocketService } from './web-socket.service';
import { Subject, Observable, Observer } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../Models/User';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
    private subject: Subject<User[]>;

    constructor(
        @Inject('BASE_URL') private baseUrl: string,
        private ws: WebSocketService,
        private http: HttpClient
        ) {
    }

    connect(): Subject<User[]> {
        this.subject = <Subject<User[]>>this.ws.connect('wss://localhost:5001/ws/users')
            .pipe(map((x: MessageEvent) => {
                if (x.data) {
                  const array = new Array<User>();
                  const users = JSON.parse(x.data) as User[];
                  users.forEach(usr => {
                      array.push(new User(usr.name, usr.password));
                  });
                  return array;
                } else {
                    return undefined;
                }
            }));
        return this.subject;
    }

    disconnect() {
        this.ws.disconnect();
    }

    insertUser(users: User[]): Promise<boolean> {
      return new Promise<boolean>((resolve, reject) => {
        const httpOptions = {
          headers: new HttpHeaders({
            'Content-Type':  'application/json',
          })
        };
        this.http.post<User[]>(this.baseUrl + 'api/UsersData', JSON.stringify(users), httpOptions).subscribe(result => {
            console.log(JSON.stringify(result));
            return resolve(true);
        }, error => {
            console.error(error)
            reject(error);
        });
      });
    }

    deleteUser(users: User[]) {
    }
}
