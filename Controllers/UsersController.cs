using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;

namespace angularAsp.Controllers
{
    public class UsersController
    {
        private readonly List<WebSocket> clients = new List<WebSocket>();
        private readonly List<User> userList = new List<User>()
        { new User { Name = "mkoba", Password = "pass1" },
            new User { Name = "mkoba2", Password = "Pass2" } };
        private static readonly UsersController instance = new UsersController();

        public static UsersController Instance 
        {
            get { return instance; }
        }

        public void Map(IApplicationBuilder app)
        {
            var option = new WebSocketOptions()
            {
                KeepAliveInterval = TimeSpan.FromSeconds(120),
                ReceiveBufferSize = 4 * 1024
            };
            app.UseWebSockets(option);
            app.Use(Acceptor);
        }

        private async Task Acceptor(HttpContext hc, Func<Task> n)
        {

            if (!hc.WebSockets.IsWebSocketRequest)
            {
                await n.Invoke();
                return;
            }
            var websocket = await hc.WebSockets.AcceptWebSocketAsync();
            this.clients.Add(websocket);
            {
                await websocket.SendAsync(
                    new ArraySegment<byte>(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(this.userList.ToArray()))),
                    WebSocketMessageType.Text,
                    true,
                    CancellationToken.None
                );
            }

            var resultCount = 0;
            var buffer = new byte[4096];

            while(true)
            {
                var segmentbuffer = new ArraySegment<byte>(buffer, resultCount, buffer.Length - resultCount);
                var result = await websocket.ReceiveAsync(segmentbuffer, CancellationToken.None);
                resultCount += result.Count;
                if (resultCount >= buffer.Length)
                {
                    Debug.WriteLine("Long Message!!!");
                    await websocket.CloseOutputAsync(WebSocketCloseStatus.PolicyViolation, "Long Message",
                        CancellationToken.None);
                    websocket.Dispose();
                    this.clients.Remove(websocket);
                    break;
                }
                else if (result.EndOfMessage)
                {
                    if (result.MessageType == WebSocketMessageType.Close || resultCount == 0)
                    {
                        Debug.WriteLine("Message Close");
                        await websocket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "Close Message",
                            CancellationToken.None);
                        websocket.Dispose();
                        this.clients.Remove(websocket);
                        break;
                    }
                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        var str = Encoding.UTF8.GetString(buffer, 0, resultCount);
                        Debug.WriteLine(str);
                        resultCount = 0;
                    }
                    else
                    {
                        Debug.WriteLine("Unknown Type Message");
                        await websocket.CloseOutputAsync(WebSocketCloseStatus.InvalidMessageType, "Unknown Type Message",
                            CancellationToken.None);
                        websocket.Dispose();
                        this.clients.Remove(websocket);
                        break;
                    }
                }
            }
        }

        public void Broadcast()
        {
            this.clients.ForEach(async (client) =>
            {
                await client.SendAsync(
                    new ArraySegment<byte>(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(this.userList.ToArray()))),
                    WebSocketMessageType.Text,
                    true,
                    CancellationToken.None
                );
            });
        }

        public void AddUser(User[] users)
        {
            foreach(var user in users)
            {
                this.userList.Add(user);
            }
        }
    }

    public class User
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("password")]
        public string Password { get; set; }
    }
}
