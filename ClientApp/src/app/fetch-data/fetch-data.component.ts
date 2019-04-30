import { Component, Inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from '../service/web-socket.service';
import { UsersService } from '../service/users.service';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../Models/User';

@Component({
  selector: 'app-fetch-data',
  templateUrl: './fetch-data.component.html'
})
export class FetchDataComponent implements OnDestroy {
  userObservable: Observable<User[]>;

  constructor(
    http: HttpClient,
    @Inject('BASE_URL') baseUrl: string,
    private webSocket: WebSocketService,
    private usersService: UsersService
  ) {
    this.userObservable = usersService.connect();
    this.userObservable.subscribe(usrs => {
      if (!usrs) {
          return;
      }
      usrs.forEach(usr => {
          console.log(`Name:${usr.Name} Password:${usr.Password}`);
       });
    });
  }

  ngOnDestroy() {
    this.usersService.disconnect();
  }

  async clicked() {
    try {
      console.log('pressed');
      const usrs = new Array<User>();
      usrs.push(new User("mkoba3", "pass3"));
      const result = await this.usersService.insertUser(usrs);
      console.log(`result:${result}`);
    } catch (err) {
      console.error('err:' + err.message);
    }
  }
}
