#ifndef __SOCKETAPI_CPP__
#define __SOCKETAPI_CPP__

#include "socket_api.h"

int SendSocketMessage(int socket, std::string message) {
  return SendSocketMessage(socket, message.c_str(), message.length());
}

int SendSocketMessage(int socket, const char * message, int length) {
  
  return 0;
}

#endif
