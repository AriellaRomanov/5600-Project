#ifndef __SERVER_H__
#define __SERVER_H__

#ifdef __WIN32__
#include <winsock2.h>
#include <ws2tcpip.h>
#else
#include <sys/types.h>
#include <netinet/in.h>
#include <sys/socket.h>
#endif

#include <fstream>
#include <dirent.h>
#include <sys/stat.h>
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
#include <tuple>
#include <cstdlib>
//#include "socket_api.h"

#ifndef SOCKET_ERROR
#define SOCKET_ERROR -1
#endif

#define USE_TCP 1

struct Client {
    bool completed = false;
    pthread_t c_thread;
    sockaddr_in addr;
    socklen_t length;
    int soc = SOCKET_ERROR;
    std::map< std::string, std::vector<int> > file_map;
};

static const int buff_size = 1024;
int server_socket = SOCKET_ERROR;
sockaddr_in server_addr;
int port = 4321;
std::string folder = "torrents";

pthread_t close_thread;
bool stopping = false;
std::vector<Client> clients;

void * ListenForClose(void *);
void * ManageClient(void * client);
void ListFiles(Client * client, std::vector<std::string> &words);
void GetFile(Client * client, std::vector<std::string> &words);
void UpdateTracker(Client * client, std::vector<std::string> &words);
void CreateTracker(Client * client, std::vector<std::string> &words);
void ReadFileIntoLines(std::string path, std::vector<std::string> * lines);
void BreakBySpaces(char * buffer, std::vector<std::string> * words);

#endif
