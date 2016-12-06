#include "server.h"

using namespace std;

int main() {

  //read config file
  std::cout << "Reading server config file.\n";
  std::vector<std::string> config_lines;
  ReadFileIntoLines("sconfig", &config_lines);
  if (config_lines.size() > 0) port = stoi(config_lines.at(0)); //first line is port number
  if (config_lines.size() > 1) folder = config_lines.at(1); //second line is torrent folder
  std::cout << "Port: " << port << ", Folder: " << folder << "\n";

  //check if directory already exists
  struct stat dirstat;
  int stat_rc = stat(folder.c_str(), &dirstat);
  if (stat_rc != 0 || (stat_rc == 0 && !S_ISDIR(dirstat.st_mode))) {
    //need to create directory
    std::cout << "Creating folder: " << folder << "\n";
    int rc = mkdir(folder.c_str(), 0700);
    if (rc != 0) {
      std::cout << "Unable to create folder.\n";
      return 0;
    }
  }
/*
  if (FAKE_CLIENT) {
    std::cout << "\nRunning FakeClient through functions.\n";
    std::vector<std::string> words0;
    BreakBySpaces("REQ LIST\n", &words0);
    ListFiles(NULL, words0);
    std::vector<std::string> words1;
    BreakBySpaces("GET fake.txt.track\n", &words1);
    GetFile(NULL, words1);
    std::vector<std::string> words2;
    BreakBySpaces("createtracker filename.txt filesize description md5 ip-address port-number\n", &words2);
    CreateTracker(NULL, words2);
    std::vector<std::string> words3;
    BreakBySpaces("updatetracker filename.txt start_byte end_byte ip-address2 port-number2\n", &words3);
    UpdateTracker(NULL, words3);
    std::cout << "FakeClient completed.\n\n";
  }
*/
  //create TCP server socket
  std::cout << "Creating socket for server.\n";
  server_socket = socket(AF_INET, SOCK_STREAM, 0);
  if (server_socket == SOCKET_ERROR) {
    std::cout << "Server socket creation failed.\n";
    return 0;
  }

  //initialize address information
  server_addr.sin_family = AF_INET; //internet
  server_addr.sin_addr.s_addr = INADDR_ANY; //any address
  server_addr.sin_port = htons(port); //convert port number

  //set socket to non-blocking
  #ifdef WIN32
    unsigned long no_block = 1;
    ioctlsocket(server_socket, FIONBIO, &no_block);
  #else
    fcntl(server_socket, F_SETFL, O_NONBLOCK);
  #endif

  //bind socket to address
  std::cout << "Binding socket to address.\n";
  bool cont = bind(server_socket, (struct sockaddr*)&server_addr, sizeof(server_addr));
  if (cont < 0) {
    std::cout << "Server bind failed.\n";
    return 0;
  }

  //set server to listen; queue up to five clients while busy
  std::cout << "Listening for clients.\n";
  listen(server_socket, 5);

  //create process that listens for when to close
  int p_rc = pthread_create(&close_thread, NULL, ListenForClose, NULL);
  if (p_rc != 0) {
    std::cout << "Unable to create close_thread: " << p_rc << "\n";
    return 0;
  }

  //loop to continuously monitor for clients and wait for stop command
  while (!stopping) {
    Client client;
    client.soc = accept(server_socket, (struct sockaddr *)&client.addr, &client.length);
    if (client.soc != SOCKET_ERROR) {
      std::cout << "New client accepted: " << client.soc << "\n";
      //client received: start thread
      clients.push_back(client);
      int rc = pthread_create(&clients.back().c_thread, NULL, ManageClient, (void *)&(clients.back()));
      if (rc != 0) {
        std::cout << "Unable to create client_thread: " << rc << "\n";
      }
    }
  }
  std::cout << "No longer listening for clients.\n";

  return 0;
}

void * ListenForClose(void *) {
  std::cout << "Listening for stop command (\"close\").\n";
  //read in from the keyboard "close" command
  std::string input = "";
  do {
    cin >> input;
    //set stop flag so no further clients will be accepted
    stopping = (strcmp(input.c_str(), "close") == 0);
    for (int i = 0; i < (int)clients.size(); i++) {
      //remove completed clients from list
      if (clients.at(i).completed) clients.erase(clients.begin() + i--);
    }
  } while (!stopping);

  std::cout << "Stop command received. Waiting for clients to complete.\n";
  //wait for all clients to complete
  while ((int)clients.size() > 0) {
    for (int i = 0; i < (int)clients.size(); i++) {
      if (clients.at(i).completed) clients.erase(clients.begin() + i--);
    }
  }
  
  std::cout << "Closing server.\n";
  //close the server socket
  close(server_socket);
  //end thread
  pthread_exit(NULL);
}

void * ManageClient(void * arg) {
  Client * client = (Client *)arg;
  if (client == NULL) pthread_exit(NULL);;

  //get message from the client
  char buffer[buff_size];
  int rc = read(client->soc, buffer, buff_size - 1);
  if (rc < 0) {
    std::cout << "Client " << client->soc << ": Error reading message.\n";
  }
  else {
    //sort client into correct functions based on request
    std::vector<std::string> words;
    BreakBySpaces(buffer, &words);

    if ((int)words.size() > 1 && words.at(0) == "REQ") {
      ListFiles(client, words);
    }
    else if ((int)words.size() > 1 && words.at(0) == "GET") {
      GetFile(client, words);
    }
    else if ((int)words.size() > 1 && words.at(0) == "updatetracker") {
      UpdateTracker(client, words);
    }
    else if ((int)words.size() > 1 && words.at(0) == "createtracker") {
      CreateTracker(client, words);
    }
    else {
      std::cout << "Client " << client->soc << ": unrecognized command.\n";
      rc = write(client->soc, "Error: unrecognized command", 27);
      if (rc == -1) {
        std::cout << "Unable to reply to client.\n";
      }
    }
  }

  std::cout << "Ending connection with client: " << client->soc << "\n";
  //end the client connection
  close(client->soc);
  //mark client as completed
  client->completed = true;
  //end thread
  pthread_exit(NULL);
}

void ListFiles(Client * client, std::vector<std::string> &words) {
  if (client != NULL) std::cout << "Client " << client->soc << " is requesting the tracker file list.\n";
  else std::cout << "FakeClient is requesting the tracker file list.\n";

  DIR *dp;
  dp = opendir(folder.c_str());
  if (dp == NULL) {
    std::cout << "Unable to open tracker folder.\n";
    return;
  }
    
  std::vector< std::tuple<std::string, std::string, std::string> > data;

  struct dirent *dirp = NULL;
  do {
    dirp = readdir(dp);
    if(dirp != NULL) {
      //we have a file in the directory
      std::string filename = std::string(dirp->d_name);
      std::string filepath = folder + "/" + filename;
      struct stat filestat;
      if (!stat(filepath.c_str(), &filestat) &&
          !S_ISDIR(filestat.st_mode)) {
        //open file for reading
        std::vector<std::string> lines;
        ReadFileIntoLines(filepath, &lines);
        std::string filesize = "";
        std::string md5 = "";
        if ((int)lines.size() > 2) filesize = lines.at(1).substr(10);
        if ((int)lines.size() > 4) md5 = lines.at(3).substr(5);
        data.push_back( std::make_tuple(filename, filesize, md5) );
      }
    }
  } while (dirp != NULL);

  closedir(dp);

  std::string reply = "";
  char buff[buff_size];
  sprintf(buff, "REP LIST %i\n", (int)data.size());
  reply.append(std::string(buff));
  for (int i = 0; i < (int)data.size(); i++) {
    memset(buff, 0, buff_size);
    sprintf(buff, "%i %s %s %s\n", i, std::get<0>(data.at(i)).c_str(), std::get<1>(data.at(i)).c_str(), std::get<2>(data.at(i)).c_str());
    reply.append(std::string(buff));
  }
  reply.append("REP LIST END\n");
  if (client != NULL) write(client->soc, reply.c_str(), reply.length());
  std::cout << "\n" << reply << "\n";
}

void GetFile(Client * client, std::vector<std::string> &words) {
  if ((int)words.size() < 2) {
    std::cout << "No filename detected.\n";
    return;
  }
  std::string filename = words.at(1);
  filename = filename.substr(0, filename.length() - 7);

  if (client != NULL) std::cout << "Client " << client->soc << " is requesting tracker file for " << filename << "\n";
  else std::cout << "FakeClient is requesting tracker file for " << filename << "\n";

  std::vector<std::string> lines;
  ReadFileIntoLines(folder + "/" + filename, &lines);
  std::string md5 = "";
  if ((int)lines.size() > 4) md5 = lines.at(3).substr(5);
  //intelligently get md5

  std::string reply = "REP GET BEGIN\n";
  for (int i = 0; i < (int)lines.size(); i++) {
    reply.append(lines.at(i) + "\n");
  }
  reply.append("REP GET END " + md5 + "\n");

  if (client != NULL) write(client->soc, reply.c_str(), reply.length());
  std::cout << "\n" << reply << "\n";
}

void UpdateTracker(Client * client, std::vector<std::string> &words) {
  std::string fail_msg = "updatetracker fail\n";
  std::string err_msg = "updatetracker ferr\n";
  std::string succ_msg = "updatetracker succ\n";
  if ((int)words.size() < 6) {
    if(client != NULL) write(client->soc, fail_msg.c_str(), fail_msg.length());
    std::cout << "Too few arguments to UpdateTracker().\n";
  }

  std::string filename = words.at(1);

  if (client != NULL) std::cout << "Client " << client->soc << " is updating tracker file for " << filename << "\n";
  else std::cout << "FakeClient is updating tracker file for " << filename << "\n";

  std::string start = words.at(2);
  std::string end = words.at(3);
  std::string addr = words.at(4);
  std::string port = words.at(5);
  int index = port.find("\n");
  if (index != std::string::npos) port = port.substr(0, port.length() - 1);

  time_t nw = time(0);
  char buff[buff_size];
  sprintf(buff, "%s:%s:%s:%s:%i", addr.c_str(), port.c_str(), start.c_str(), end.c_str(), (int)nw);
  std::string new_line(buff);

  fail_msg = "updatetracker " + filename + " fail\n";
  err_msg = "updatetracker " + filename + " ferr\n";
  succ_msg = "updatetracker " + filename + " succ\n";

  std::string filepath = folder + "/" + filename;
  std::vector<std::string> lines;
  ReadFileIntoLines(filepath, &lines);

  if ((int)lines.size() == 0) {
    if (client != NULL) write(client->soc, err_msg.c_str(), err_msg.length());
    std::cout << filepath << ": does not exist.\n";
    return;
  }

  bool edited = false;
  for (int i = (int)lines.size() - 1; i >= 0; i--) {
    std::string line = lines.at(i);
    if (line[0] != '#') {
      int index = line.find(":");
      if (index != std::string::npos) {
        std::string l_addr = line.substr(0, index);
        int index2 = line.find(":", index + 1);
        if (index2 != std::string::npos) {
          std::string l_port = line.substr(index + 1, index2 - index - 1);
          if (l_port.find("\n") != std::string::npos) port = port.substr(0, port.length() - 1);

          if(l_port == port && l_addr == addr) {
            lines.at(i) = new_line;
            edited = true;
          }
          else {
            //check if we need to remove this client from the list
            index = line.rfind(":");
            if (index != std::string::npos) {
              int past = stoi(line.substr(index + 1));
              double elapsed = (int)nw - past;
              if (elapsed > 15000) lines.erase(lines.begin() + i);
            }
          }
        }
      }
    }
  }

  if (!edited) lines.push_back(new_line);

  fstream fstr;
  fstr.open(filepath.c_str(), fstream::out | fstream::trunc);
  if (fstr.is_open()) {
    for (int i = 0; i < (int)lines.size(); i++) {
      fstr << lines.at(i) << "\n";
    }
    fstr.close();
    if (client != NULL) write(client->soc, succ_msg.c_str(), succ_msg.length());
    else std::cout << "Updated Tracker: " << filepath << "\n";
    return;
  }
  else {
    if (client != NULL) write(client->soc, fail_msg.c_str(), fail_msg.length());
    std::cout << filepath << ": cannot open to write.\n";
    return;
  }


}

void CreateTracker(Client * client, std::vector<std::string> &words) {
  std::string fail_msg = "createtracker fail\n";
  std::string err_msg = "createtracker ferr\n";
  std::string succ_msg = "createtracker succ\n";
  if ((int)words.size() < 6) {
    if(client != NULL) write(client->soc, fail_msg.c_str(), fail_msg.length());
    std::cout << "Too few arguments to CreateTracker().\n";
  }

  std::string filename = words.at(1);

  if (client != NULL) std::cout << "Client " << client->soc << " is creating tracker file for " << filename << "\n";
  else std::cout << "FakeClient is creating tracker file for " << filename << "\n";

  std::string filesize = words.at(2);

  int index = words.size() - 1;
  std::string port = words.at(index--);
  std::string addr = words.at(index--);
  std::string md5 = words.at(index--);

  std::string desc = "";
  for (int i = 3; i <= index; i++) {
    desc.append(words.at(i) + " ");
  }

  index = port.find("\n");
  if (index != std::string::npos) port = port.substr(0, port.length() - 1);
  
  std::vector<std::string> lines;
  lines.push_back("Filename: " + filename + "\n");
  lines.push_back("Filesize: " + filesize + "\n");
  lines.push_back("Description: " + desc + "\n");
  lines.push_back("MD5: " + md5 + "\n");
  lines.push_back("#list of peers follows next\n");
  
  char buff[buff_size];
  sprintf(buff, "%s:%s:0:%s:%i\n", addr.c_str(), port.c_str(), filesize.c_str(), (int)time(0));
  lines.push_back(std::string(buff));

  std::string filepath = folder + "/" + filename;
  if (std::ifstream(filepath)) {
    if (client != NULL) write(client->soc, err_msg.c_str(), err_msg.length());
    std::cout << filepath << " already exists.\n";
    return;
  }
  else {
    fstream fstr;
    fstr.open(filepath.c_str(), fstream::out);
    if (fstr.is_open()) {
      for (int i = 0; i < (int)lines.size(); i++) {
        fstr << lines.at(i);
      }
      fstr.close();
      if (client != NULL) write(client->soc, succ_msg.c_str(), succ_msg.length());
      std::cout << "Created file: " << filepath << "\n";
    }
    else {
      if (client != NULL) write(client->soc, fail_msg.c_str(), fail_msg.length());
      std::cout << filepath << ": cannot open to write.\n";
      return;
    }
  }

}

void ReadFileIntoLines(std::string path, std::vector<std::string> * lines) {

  fstream fstr;
  fstr.open(path.c_str());
  if (fstr.is_open()) {
    std::string test = "";
    while(std::getline(fstr, test)) {
      lines->push_back(test);
      test = "";
    }
  }
  fstr.close();

  return;
}

void BreakBySpaces(char * buffer, std::vector<std::string> * words) {
  int index = 0;
  int old_index = 0;
  std::string str(buffer);
  do {
    index = str.find(" ", old_index);
    words->push_back(str.substr(old_index, index - old_index));
    old_index = index + 1;
  } while (index != std::string::npos);
}
