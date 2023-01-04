const users = [];

const userJoin = ({ id, name, room }) => {
  const numberOfUsersInRoom = users.filter((user) => user.room === room).length;
  if (numberOfUsersInRoom >= 2) return { error: "Room full" };

  const newUser = { id, name, room };
  users.push(newUser);
  return { newUser };
};

const userExit = (id) => {
  const idx = users.findIndex((user) => user.id === id);

  if (idx !== -1) return users.splice(idx, 1)[0];
};

const getUser = (id) => {
  return users.find((user) => user.id === id);
};

const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room);
};

module.exports = { userJoin, userExit, getUser, getUsersInRoom };
