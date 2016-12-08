rm ./Peer1/bigger_book.txt
rm ./Peer2/book.txt
rm server_code/torrents/*
for I in {3..13}
do
  rm ./Peer$I/*
done