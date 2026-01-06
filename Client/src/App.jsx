
import React from 'react'
import Square from './Square/Square'
import './App.css'
import { useState, useEffect } from 'react'
import { io } from 'socket.io-client';
import Swal from 'sweetalert2';



// Dummy data for rendering squares
const renderFrom = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

function App() {
  const [gameState, setGameState] = useState(renderFrom)
  const [currentPlayer, setCurrentPlayer] = useState("circle");
  const [finishState, setFinishState] = useState(false);
  const [finishedArrayState, setFinishedArrayState] = useState([]);
  const [playOnline, setPlayOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [opponentName, setOpponentName] = useState(null);
  const [playingAs, setPlayingAs] = useState(null);

  const checkWinner = () => {
    // row dynamic check
    for (let row = 0; row < gameState.length; row++) {
      if (gameState[row][0] === gameState[row][1] && gameState[row][1] === gameState[row][2]) {
        // Winning squares ke index store karna
        setFinishedArrayState([row * 3 + 0, row * 3 + 1, row * 3 + 2]);
        return gameState[row][0];
      }
    }
    // column dynamic check
    for (let col = 0; col < gameState.length; col++) {
      if (gameState[0][col] === gameState[1][col] && gameState[1][col] === gameState[2][col]) {
        setFinishedArrayState([0 * 3 + col, 1 * 3 + col, 2 * 3 + col]);
        return gameState[0][col];
      }
    }
    // Diagonal check
    if (gameState[0][0] === gameState[1][1] && gameState[1][1] === gameState[2][2]) {
      setFinishedArrayState([0 * 3 + 0, 1 * 3 + 1, 2 * 3 + 2]);

      return gameState[0][0];
    }
    if (gameState[0][2] === gameState[1][1] && gameState[1][1] === gameState[2][0]) {
      setFinishedArrayState([0 * 3 + 2, 1 * 3 + 1, 2 * 3 + 0]);

      return gameState[0][2];
    }
    const isDrawMatch = gameState.flat().every((e) => {
      if (e === 'circle' || e === 'cross') return true;
    });
    if (isDrawMatch) return "draw";
    console.log(isDrawMatch);
    return null;
  }

  useEffect(() => {
    const winner = checkWinner();
    if (winner) {
      setFinishState(winner);
    }
  }, [gameState]);

  //   Take player name using sweet alert
  const takePlayerName = async () => {
    const result = await Swal.fire({
      title: "Enter your Name",
      input: "text",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      }
    });
    return result;
  }

  socket?.on("opponentLeftMatch",()=>{
    alert("Opponent has left the match");
    setFinishState("opponentLeftMatch");
  })

  socket?.on("playerMoveFromServer", (data) => {
    const id = data.state.id;
    setGameState((prevState) => {
      let newState = [...prevState];
      const rowIndex = Math.floor(id / 3);
      const colIndex = id % 3;
      console.log(rowIndex, colIndex);
      newState[rowIndex][colIndex] = data.state.sign;
      return newState;
    });
    setCurrentPlayer(data.state.sign === 'circle' ? 'cross' : 'circle');
  });


  //  Socket connection with server
  socket?.on("connect", function () {
    setPlayOnline(true);
  });
  // listening opponent found or not event from server
  socket?.on("OpponentNotFound", function () {
    setOpponentName(false);
  })
  socket?.on("OpponentFound", function (data) {
    setPlayingAs(data.playingAs);
    console.log(data);
    setOpponentName(data.opponentName);
  })
  //  play button click handler
  async function playOnlineClick() {
    const result = await takePlayerName();
    // yadi user ne apna name enter nahi kiya to return kar do
    if (!result.isConfirmed) return;

    const username = result.value;
    setPlayerName(username);

    // console.log(result);
    //  Socket.io client import and connection
    const newSocket = io('http://localhost:3000', {
      autoConnect: true
    });
    // emit request to play event to server with player name
    newSocket.emit("request_to_play", {
      playerName: username,
    });
    setSocket(newSocket);
  }
  //  play button rendering
  if (!playOnline) {
    return <div className='main-div'>
      <button onClick={playOnlineClick} className='playOnline'> Play Online </button>
    </div>
  }
  if (playOnline && !opponentName) {
    return <div className="waiting">
      <p>Waiting for opponent to join...</p>
    </div>
  }
  return (
    <div className='main-div'>
      <div className='move-detection'>
        <div className={`left ${currentPlayer === playingAs ? "current-move-" + currentPlayer : ""}`}>{playerName}</div>
        <div className={`right ${currentPlayer !== playingAs ? "current-move-" + currentPlayer : ""}`}>{opponentName}</div>
      </div>
      <div >
        <h1 className='game-heading water-background'>Tic Tac Toe</h1>
        <div className='square-wrapper'>
          {
            gameState.map((arr, rowIndex) =>
              arr.map((e, colIndex) => {
                return (
                <Square
                socket={socket}
                playingAs={playingAs}
                  gameState={gameState}
                  finishedArrayState={finishedArrayState}
                  finishState={finishState}
                  // setFinishState={setFinishState}
                  currentPlayer={currentPlayer}
                  setCurrentPlayer={setCurrentPlayer}
                  setGameState={setGameState}
                  id={rowIndex * 3 + colIndex}
                  key={rowIndex * 3 + colIndex}
                  currentElement={e}
                />
              );
              })
            )}
        </div>
        {
          finishState && finishState !== "opponentLeftMatch" && finishState  !== "draw" &&
          (<h3 className='finished-state'>{finishState === playingAs ? "You" : finishState} won the game </h3>
          )
        }
        {
          finishState   && finishState !== "opponentLeftMatch" && finishState === "draw" &&
          (<h3 className='finished-state'> It's a draw </h3>
          )
        }
      </div>
      {
        !finishState && opponentName &&
        (<h3 className='finished-state'> You are playing against {opponentName} </h3>
        )
      }
      {
        finishState && finishState === "opponentLeftMatch" &&  
        (<h3 >  You won the match, because your opponent left the game. </h3>
        )
      }
    </div>
  )
}
export default App;
