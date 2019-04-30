import { Injectable } from '@angular/core';
import {Subject, Observable, Observer} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

    private subject: Subject<MessageEvent>;   // -- ① WebSocket接続時に返す Subject
    private ws: WebSocket;
 
  connect(url: string): Subject<MessageEvent> {   // -- ②  このメソッドを呼び出して Subject を手に入れます
    if (!this.subject || !this.ws || (this.ws && this.ws.readyState !== WebSocket.OPEN)) {
      this.subject = this.create(url);
    }
    return this.subject;
  }
 
  private create(url: string): Subject<MessageEvent> {

    console.log('create');
    this.ws = new WebSocket(url);　　// -- ③ WebSocket オブジェクトを生成します
    const observable = Observable.create((obs: Observer<MessageEvent>) => { // -- ④ Observable オブジェクトを生成します
      this.ws.onmessage = obs.next.bind(obs);
      this.ws.onerror = obs.error.bind(obs);
      this.ws.onclose = obs.complete.bind(obs);
      this.ws.onopen = obs.next.bind(obs);
 
      return this.ws.close.bind(this.ws);
      });

 
    const observer = {    // -- ⑤ Observer オブジェクトを生成します
      next: (data: Object) => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(data));
        } else {
            console.log('not opened')
        }
      },
    };
    return Subject.create(observer, observable);    // -- ⑥ Subject を生成してconnect
  }

  disconnect() {
      this.ws.close(1000, 'disconnected');
  }
}
