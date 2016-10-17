#ifndef __CLIENT_H__
#define __CLIENT_H__

#ifdef __WIN32__
#include <winsock2.h>
#include <ws2tcpip.h>
#else
#include <sys/types.h>
#include <netinet/in.h>
#include <sys/socket.h>
#endif

#include <pthread.h>
#include <unistd.h>
#include <fcntl.h>
#include <thread>
#include <map>
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <iostream>
#include <vector>
#include <cstdlib>
#include <netdb.h>

int port = 4321;
int soc = -1;
const char * address = "rc06xcs213.managed.mst.edu";
const char * message = "hello world";
hostent * server;
sockaddr_in server_addr;

#endif
