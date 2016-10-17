#include "server.h"

using namespace std;

int main() {

  //read config file
  int config;
  config = open("sconfig", O_RDONLY);
  if (config < 0) {
    std::cout << "Unable to open file sconfig\n";
    return 0;
  }
  char buffer[buff_size];
  int rc = read(config, buffer, buff_size);
  if (rc <= 0) {
    std::cout << "Unable to read file sconfig\n";
    return 0;
  }
  std::string lines(buffer);
  int index = lines.find("\n");
  if (index <= 0) {
    std::cout << "Unable to find line break\n";
    return 0;
  }
  port = stoi(lines.substr(0, index));
  folder = lines.substr(index + 1);

  //create server socket
  if (USE_TCP) server_socket = socket(AF_INET, SOCK_STREAM, 0);
  else server_socket = socket(AF_INET, SOCK_DGRAM, 0);
  if (server_socket == SOCKET_ERROR) {
    std::cout << "SERVER socket creation failed\n";
    return 0;
  }

  server_addr.sin_family = AF_INET;
  server_addr.sin_addr.s_addr = INADDR_ANY;
  server_addr.sin_port = htons(port);

  //set socket to non-blocking
  #ifdef WIN32
    unsigned long no_block = 1;
    ioctlsocket(server_socket, FIONBIO, &no_block);
  #else
    fcntl(server_socket, F_SETFL, O_NONBLOCK);
  #endif

  bool cont = bind(server_socket, (struct sockaddr*)&server_addr, sizeof(server_addr));
  if (cont < 0) {
    std::cout << "SERVER bind failed\n";
    return 0;
  }

  listen(server_socket, 5);

  //create process that listens for when to close
  rc = pthread_create(&close_thread, NULL, ListenForClose, NULL);
  if (rc != 0) {
    std::cout << "Unable to create close_thread: " << rc << "\n";
    return 0;
  }

  while (!stopping) {
    Client client;
    client.soc = accept(server_socket, (struct sockaddr *)&client.addr, &client.length);
    if (client.soc != SOCKET_ERROR) {
      clients.push_back(client);
      int rc = pthread_create(&clients.back().c_thread, NULL, ManageClient, (void *)&(clients.back()));
      if (rc != 0) {
        std::cout << "Unable to create client_thread: " << rc << "\n";
      }
    }
  }

  return 0;
}

void * ListenForClose(void *) {
  std::string input = "";
  do {
    cin >> input;
    stopping = (strcmp(input.c_str(), "close") == 0);
    for (int i = 0; i < (int)clients.size(); i++) {
      if (clients.at(i).completed) clients.erase(clients.begin() + i--);
    }
  } while (!stopping);

  while ((int)clients.size() > 0) {
    for (int i = 0; i < (int)clients.size(); i++) {
      if (clients.at(i).completed) clients.erase(clients.begin() + i--);
    }
  }
  
  close(server_socket);
  pthread_exit(NULL);
}

void * ManageClient(void * arg) {
  Client * client = (Client *)arg;
  std::cout << "New client accepted: " << client->soc << "\n";

  char buffer[buff_size];
  int rc = read(client->soc, buffer, buff_size - 1);
  if (rc < 0) {
    std::cout << "Error reading client message: " << rc << "\n";
  }
  else {
    std::cout << "Client message: " << buffer << "\n";
    if (strstr(buffer, "LIST") != NULL) {
      ListFiles(client, buffer);
    }
    else if (strstr(buffer, "GET") != NULL) {
      GetFile(client, buffer);
    }
    else if (strstr(buffer, "updatetracker") != NULL) {
      UpdateTracker(client, buffer);
    }
    else if (strstr(buffer, "createtracker") != NULL) {
      CreateTracker(client, buffer);
    }
    else {
      rc = write(client->soc, "Error: unrecognized command", 27);
      if (rc != 0) {
        std::cout << "Unable to reply to client\n";
      }
    }
  }
  close(client->soc);
  client->completed = true;
  pthread_exit(NULL);
}

void ListFiles(Client * client, char * buffer) {
  if (strstr(buffer, "LIST") != NULL) {
    
  }
}

void GetFile(Client * client, char * buffer) {
  if (strstr(buffer, "GET") != NULL) {
    std::string filename = "";
    std::string input(buffer);
    int index = input.find(" ");
    if (index == std::string::npos) {
      std::cout << "No filename detected\n";
    }
    int index2 = input.find(".track");
    if (index2 == std::string::npos) {
      std::cout << "No filename detected\n";
    }
    if (index < index2) {
      filename = input.substr(index, index2 - index);
    }

    int file;
    file = open(filename.c_str(), O_RDONLY);
    if (file < 0) {
      std::cout << "Unable to open file: " << filename << "\n";
      return;
    }

    char * send_buffer;
    strcat(send_buffer, "REP GET BEGIN\n");
    int rc = 0;
    do {
      char buff[buff_size];
      rc = read(file, buff, buff_size);
      strcat(send_buffer, buff);
    } while (rc > 0);

    strcat(send_buffer, "REP GET END");
    std::string cmd(send_buffer);
    index = cmd.find("MD5: ");
    if (index == std::string::npos) {
      std::cout << "Unable to find checksum\n";
    }
    else {
      int index2 = cmd.find("\n", index);
      std::string md5 = cmd.substr(index, index - index2);
      strcat(send_buffer, md5.c_str());
    }
    strcat(send_buffer, "\n");
    write(client->soc, send_buffer, strlen(send_buffer));
  }
}

void UpdateTracker(Client * client, char * buffer) {
  if (strstr(buffer, "updatetracker") != NULL) {
    
  }
}

void CreateTracker(Client * client, char * buffer) {
  if (strstr(buffer, "createtracker") != NULL) {
    std::string input(buffer);
    int index = input.find(" ");
    if (index == std::string::npos) {
      write(client->soc, "createtracker fail", 18);
      return;
    }
    std::string command = input.substr(0, index);
    int front_index = index;
    index = input.find(" ", front_index);
    if (index == std::string::npos) {
      write(client->soc, "createtracker fail", 18);
      return;
    }
    std::string filename = input.substr(front_index + 1, index - front_index);
    front_index = index;
    index = input.find(" ", front_index);
    if (index == std::string::npos) {
      write(client->soc, "createtracker fail", 18);
      return;
    }
    std::string filesize = input.substr(front_index + 1, index - front_index);
    index = input.find_last_of(" ");
    if (index == std::string::npos || index == front_index) {
      write(client->soc, "createtracker fail", 18);
      return;
    }
    std::string port_no = input.substr(index);
    int back_index = index;
    index = input.find_last_of(" ", back_index);
    if (index == std::string::npos || index == front_index) {
      write(client->soc, "createtracker fail", 18);
      return;
    }
    std::string ip_addr = input.substr(index, back_index - index);
    back_index = index;
    index = input.find_last_of(" ", back_index);
    if (index == std::string::npos) {
      write(client->soc, "createtracker fail", 18);
      return;
    }
    std::string md5 = input.substr(index, back_index - index);


  }
}
