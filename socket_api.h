#ifndef __SOCKETAPI_H__
#define __SOCKETAPI_H__

#ifdef __WIN32__
#include <winsock2.h>
#include <ws2tcpip.h>
#else
#include <sys/types.h>
#include <netinet/in.h>
#include <sys/socket.h>
#endif

#include <stdio.h>
#include <stdint.h>
#include <string>

#define USE_TCP 1

enum UserType : uint32_t { CLIENT, SERVER };

int SendSocketMessage(int socket, std::string message);
int SendSocketMessage(int socket, const char * message, int length);

class User {
public:
  User() {
    if (USE_TCP) soc = socket(AF_INET, SOCK_STREAM, 0);
    else soc = socket(AF_INET, SOCK_DGRAM, 0);
  }
  User(UserType type) {
    u_type = type;
    if (USE_TCP) soc = socket(AF_INET, SOCK_STREAM, 0);
    else soc = socket(AF_INET, SOCK_DGRAM, 0);
  }
  bool ConnectSocket() {
    if (soc < 0) return false;
    return true;
  }
  int SendMessage(std::string Message) {
    return SendSocketMessage(soc, Message);
  }
  int SendMessage(char * Message, int length) {
    return SendSocketMessage(soc, Message, length);
  }
  UserType GetType() { return u_type; }
private:
  UserType u_type = CLIENT;
  sockaddr_in address;
  int soc = -1;
};

int SendMessage(int socket, std::string message);
int SendMessage(int socket, const char * message, int length);

#endif
