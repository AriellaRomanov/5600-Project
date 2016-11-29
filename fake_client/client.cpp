#include "client.h"

using namespace std;

int main() {

  soc = socket(AF_INET, SOCK_STREAM, 0);
  if (soc < 0) {
    std::cout << "Error creating client socket\n";
    return 0;
  }
  else {
    std::cout << "Socket created\n";
  }

  server = gethostbyname(address);
  if (server == NULL) {
    std::cout << "Server not found\n";
    return 0;
  }
  else {
    std::cout << "Server found\n";
  }

  bzero((char *)&server_addr, sizeof(server_addr));
  server_addr.sin_family = AF_INET;
  bcopy((char *)server->h_addr, (char *)&server_addr.sin_addr.s_addr, server->h_length);
  server_addr.sin_port = htons(port);

  int rc = connect(soc, (struct sockaddr *)&server_addr, sizeof(server_addr));
  if (rc < 0) {
    std:cout << "Error connecting to server: " << rc << "\n";
    return 0;
  }
  else {
    std::cout << "Connected to server\n";
  }

  bool stopping = false;
  while (!stopping) {
    std::string message = "";
    int option;
    std::cout << "Actions: [0] Stop, [1] Get List, [2] Get File, [3] UpdateTracker, [4] CreateTracker\n";
    std::cout << "Input Action: ";
    std::cin >> option;
    switch (option) {
      case 0:
        {
          stopping = true;
        }
        break;
      case 1:
        {
          message = "REQ LIST\n";
        }
        break;
      case 2:
        {
          message = "GET ";
          std::string file = "";
          std::cout << "Input filename: ";
          std::cin >> file;
          message.append(file + ".track\n");
        }
        break;
      case 3:
        {
          message = "updatetracker ";
          std::string input = "";
          std::cout << "Input filename: ";
          std::cin >> input;
          message.append(input + " ");
          std::cout << "Input start byte: ";
          std::cin >> input;
          message.append(input + " ");
          std::cout << "Input end byte: ";
          std::cin >> input;
          message.append(input + " ");
          std::cout << "Input ip_addr: ";
          std::cin >> input;
          message.append(input + " ");
          std::cout << "Input port: ";
          std::cin >> input;
          message.append(input + "\n");
        }
        break;
      case 4:
        {
          message = "createtracker ";
          std::string input = "";
          std::cout << "Input filename: ";
          std::cin >> input;
          message.append(input + " ");
          std::cout << "Input filesize: ";
          std::cin >> input;
          message.append(input + " ");
          input = "A multiword description";
          message.append(input + " ");
          std::cout << "Input md5: ";
          std::cin >> input;
          message.append(input + " ");
          std::cout << "Input ip_addr: ";
          std::cin >> input;
          message.append(input + " ");
          std::cout << "Input port: ";
          std::cin >> input;
          message.append(input + "\n");
        }
        break;
    }

    if (!stopping && message != "") {
      rc = write(soc, message.c_str(), message.length());
      if (rc < 0) std::cout << "Error writing message to server: " << rc << "\n";
      else {
        char buffer[4096];
        memset(buffer, 0, 4096 - 1);
        int read_rc = read(soc, buffer, 4096 - 1);
        if (read_rc < 0) std::cout << "Error reading message from server.\n";
        else std::cout << "\n\n" << buffer << "\n\n";
      }
      close(soc);
      soc = socket(AF_INET, SOCK_STREAM, 0);
      int rc = connect(soc, (struct sockaddr *)&server_addr, sizeof(server_addr));
      if (rc < 0) {
        std::cout << "Error connecting to server: " << rc << "\n";
        return 0;
      }
    }
  }

  close(soc);

  return 0;
}
