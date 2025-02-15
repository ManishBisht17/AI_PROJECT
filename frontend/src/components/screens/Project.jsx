import React, {
  Fragment,
  useEffect,
  useRef,
  useState,
  useContext,
} from "react";
import { useLocation } from "react-router-dom";
import { FaUserGroup } from "react-icons/fa6";
import { GrSend } from "react-icons/gr";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { CiUser } from "react-icons/ci";
import { IoMdPersonAdd } from "react-icons/io";
import axios from "../../config/axios";
import {
  initializeSocket,
  reciveMessage,
  sendMessage,
} from "../../config/socket";
import UserContext from "../../context/User.context";
const Project = () => {
  const location = useLocation();
  const [showMember, setShowMember] = useState(false);
  const [modal, setModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [projects, setProjects] = useState(location.state.elem);
  const groupListRef = useRef(null);
  const messageBox = React.createRef();

  const { user } = useContext(UserContext);

  //this just add users in the popup modal
  const handleSelect = (id) => {
    const isSelected = selectedUser.includes(id);
    if (isSelected) {
      setSelectedUser(selectedUser.filter((userId) => userId !== id));
    } else {
      setSelectedUser([...selectedUser, id]);
    }
  };

  //this is to set the collaborators, who can access certain projects
  const settingCollaborators = () => {
    axios
      .put("/projects/add-user", {
        projectId: location.state.elem._id,
        users: Array.from(selectedUser),
      })
      .then((res) => {
        setModal(false);
      })
      .catch((err) => {
        console.log("error while adding collaborators " + err);
      });
  };

  const send = () => {
    sendMessage("project-message", {
      message,
      sender: user,
    });
    appendOutGoingMessage(message)
    setMessage("");
  };

  useEffect(() => {
    initializeSocket(projects._id);

    reciveMessage("project-message", (data) => {
      appendMessage(data);
    });

    axios
      .get("/users/all")
      .then((res) => {
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.log("error while showing all users");
      });

    axios
      .get(`/projects/get-project/${location.state.elem._id}`)
      .then((res) => {
        setProjects(res.data.project);
      })
      .catch((err) => {
        console.log("error showing number of collaborators");
      });
  }, []);

  useEffect(() => {
    //this handleclose just close the side bar when you click outside of the box
    const handleClose = (e) => {
      if (groupListRef.current && !groupListRef.current.contains(e.target)) {
        setShowMember(false);
      }
    };

    document.addEventListener("mousedown", handleClose);
    return () => {
      document.addEventListener("mousedown", handleClose);
    };
  });

  const appendMessage = (messageObject) => {
    const messageBox = document.querySelector(".messages");
    const message = document.createElement("div");
    message.classList.add(
      "message",
      "bg-white",
      "w-fit",
      "max-w-[55%]",
      "flex",
      "flex-col",
      "p-1",
      "m-2",
      "rounded"
    );

    message.innerHTML = `
    <small className="text-md font-bold">${messageObject.sender.email}</small>
              <h4 className=" bg-white p-1 rounded-lg">
                ${messageObject.message}
              </h4>
    `;
    messageBox.appendChild(message);
  };
  const appendOutGoingMessage = (messageObject) => {
    const messageBox = document.querySelector(".messages");
    const message = document.createElement("div");
    message.classList.add(
      "message",
      "bg-white",
      "w-fit",
      "max-w-[55%]",
      "flex",
      "flex-col",
      "ml-auto",
      "p-1",
      "m-2",
      "rounded"
    );

    message.innerHTML = `
    <small className="text-md font-bold">${user.email}</small>
              <h4 className=" bg-white p-1 rounded-lg">
                ${messageObject}
              </h4>
    `;
    messageBox.appendChild(message);
  };

  return (
    <div className="h-screen w-screen flex">
      <section className="relative sideBar flex flex-col max-w-[24%] h-screen shadow-xl bg-zinc-300">
        <header className="absolute z-10 top-0 w-full h-16 border-b-[1px] border-black flex justify-between items-center p-4 ">
          <button onClick={() => setModal(true)}>
            <IoMdPersonAdd size={24} />
          </button>
          <button onClick={() => setShowMember(true)}>
            <FaUserGroup size={24} />
          </button>
        </header>

        <div className="message_area cursor-default h-full flex-grow flex flex-col pt-14 relative">
          <div
            ref={messageBox}
            className="messages p-1 flex-grow flex flex-col gap-1 overflow-y-auto max-h-50vh">
          </div>

          <div className="message_input flex gap-4 w-full p-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="p-2 drop-shadow-xl w-full rounded"
              type="any"
              placeholder="type message..."
            />
            <button onClick={send} className="flex-grow hover:scale-95">
              {<GrSend size={24} />}
            </button>
          </div>
        </div>

        <div
          className={`group_list w-full top-0 overflow-hidden transition-all  ${
            showMember ? "translate-x-0" : "translate-x-[-100%]"
          } h-full bg-zinc-400 absolute`}
          ref={groupListRef}
        >
          <header className="w-full h-16 border-b-[1px] border-black flex justify-between items-center p-4 ">
            <h1 className="text-lg font-semibold">Collaborators</h1>
            <button onClick={() => setShowMember(false)}>
              <IoIosCloseCircleOutline size={24} />
            </button>
          </header>
          <div className="users flex flex-col gap-2 h-full w-full">
            {projects.users &&
              projects.users.map((elem) => (
                <div
                  key={elem._id}
                  className="user cursor-pointer hover:bg-zinc-300 p-2 flex items-center gap-2"
                >
                  <div className="p-1 bg-zinc-500 w-fit h-fit rounded-full">
                    <CiUser size={24} />
                  </div>
                  <h3 className="font-semibold text-lg">{elem.email}</h3>
                </div>
              ))}
          </div>
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/45">
          <div className=" bg-white w-1/5 rounded-lg shadow-lg p-6 ">
            <h2 className="text-lg font-bold mb-4">Add Collaborators</h2>
            <div className="max-h-[40vh] flex flex-col gap-2 overflow-auto">
              {users.map((elem) => (
                <div
                  key={elem._id}
                  onClick={() => handleSelect(elem?._id)}
                  className={`flex items-center gap-2 text-lg font-semibold hover:bg-zinc-300 ${
                    selectedUser.indexOf(elem?._id) != -1 ? "bg-zinc-300" : ""
                  } `}
                >
                  <CiUser /> {elem.email}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setModal(!modal)}
                className=" bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 w-full rounded"
              >
                Cancel
              </button>
              <button
                onClick={settingCollaborators}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 w-full rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Project;
