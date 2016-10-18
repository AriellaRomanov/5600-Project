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

  rc = write(soc, message, strlen(message));
  if (rc < 0) {
    std::cout << "Error writing message to server: " << rc << "\n";
  }
  else {
    std::cout << "Wrote message to server\n";
  }

  close(soc);

  return 0;
}
