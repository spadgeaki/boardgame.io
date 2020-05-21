import { d as _inherits, f as _createSuper, a as _classCallCheck, _ as _createClass, b as _defineProperty, k as _objectSpread2, h as _createForOfIteratorHelper, t as _assertThisInitialized, o as _toConsumableArray } from './reducer-fbf421a2.js';
import 'redux';
import 'immer';
import './Debug-0bba361b.js';
import 'flatted';
import { M as MCTSBot } from './ai-6331d9a0.js';
import './initialize-d5f56b08.js';
import { C as Client$1 } from './client-d47978e1.js';
import React from 'react';
import PropTypes from 'prop-types';
import Cookies from 'react-cookies';
import './base-c99f5be2.js';
import { S as SocketIO, L as Local } from './socketio-c9815b2d.js';
import './master-39ebec79.js';
import 'socket.io-client';

/**
 * Client
 *
 * boardgame.io React client.
 *
 * @param {...object} game - The return value of `Game`.
 * @param {...object} numPlayers - The number of players.
 * @param {...object} board - The React component for the game.
 * @param {...object} loading - (optional) The React component for the loading state.
 * @param {...object} multiplayer - Set to a falsy value or a transportFactory, e.g., SocketIO()
 * @param {...object} debug - Enables the Debug UI.
 * @param {...object} enhancer - Optional enhancer to send to the Redux store
 *
 * Returns:
 *   A React component that wraps board and provides an
 *   API through props for it to interact with the framework
 *   and dispatch actions such as MAKE_MOVE, GAME_EVENT, RESET,
 *   UNDO and REDO.
 */

function Client(opts) {
  var _class, _temp;

  var game = opts.game,
      numPlayers = opts.numPlayers,
      loading = opts.loading,
      board = opts.board,
      multiplayer = opts.multiplayer,
      enhancer = opts.enhancer,
      debug = opts.debug; // Component that is displayed before the client has synced
  // with the game master.

  if (loading === undefined) {
    var Loading = function Loading() {
      return /*#__PURE__*/React.createElement("div", {
        className: "bgio-loading"
      }, "connecting...");
    };

    loading = Loading;
  }
  /*
   * WrappedBoard
   *
   * The main React component that wraps the passed in
   * board component and adds the API to its props.
   */


  return _temp = _class = /*#__PURE__*/function (_React$Component) {
    _inherits(WrappedBoard, _React$Component);

    var _super = _createSuper(WrappedBoard);

    function WrappedBoard(props) {
      var _this;

      _classCallCheck(this, WrappedBoard);

      _this = _super.call(this, props);

      if (debug === undefined) {
        debug = props.debug;
      }

      _this.client = Client$1({
        game: game,
        debug: debug,
        numPlayers: numPlayers,
        multiplayer: multiplayer,
        gameID: props.gameID,
        playerID: props.playerID,
        credentials: props.credentials,
        enhancer: enhancer
      });
      return _this;
    }

    _createClass(WrappedBoard, [{
      key: "componentDidMount",
      value: function componentDidMount() {
        var _this2 = this;

        this.unsubscribe = this.client.subscribe(function () {
          return _this2.forceUpdate();
        });
        this.client.start();
      }
    }, {
      key: "componentWillUnmount",
      value: function componentWillUnmount() {
        this.client.stop();
        this.unsubscribe();
      }
    }, {
      key: "componentDidUpdate",
      value: function componentDidUpdate(prevProps) {
        if (this.props.gameID != prevProps.gameID) {
          this.client.updateGameID(this.props.gameID);
        }

        if (this.props.playerID != prevProps.playerID) {
          this.client.updatePlayerID(this.props.playerID);
        }

        if (this.props.credentials != prevProps.credentials) {
          this.client.updateCredentials(this.props.credentials);
        }
      }
    }, {
      key: "render",
      value: function render() {
        var state = this.client.getState();

        if (state === null) {
          return React.createElement(loading);
        }

        var _board = null;

        if (board) {
          _board = React.createElement(board, _objectSpread2(_objectSpread2(_objectSpread2({}, state), this.props), {}, {
            isMultiplayer: !!multiplayer,
            moves: this.client.moves,
            events: this.client.events,
            gameID: this.client.gameID,
            playerID: this.client.playerID,
            reset: this.client.reset,
            undo: this.client.undo,
            redo: this.client.redo,
            log: this.client.log,
            gameMetadata: this.client.gameMetadata
          }));
        }

        return /*#__PURE__*/React.createElement("div", {
          className: "bgio-client"
        }, _board);
      }
    }]);

    return WrappedBoard;
  }(React.Component), _defineProperty(_class, "propTypes", {
    // The ID of a game to connect to.
    // Only relevant in multiplayer.
    gameID: PropTypes.string,
    // The ID of the player associated with this client.
    // Only relevant in multiplayer.
    playerID: PropTypes.string,
    // This client's authentication credentials.
    // Only relevant in multiplayer.
    credentials: PropTypes.string,
    // Enable / disable the Debug UI.
    debug: PropTypes.any
  }), _defineProperty(_class, "defaultProps", {
    gameID: 'default',
    playerID: null,
    credentials: null,
    debug: true
  }), _temp;
}

/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
var _LobbyConnectionImpl = /*#__PURE__*/function () {
  function _LobbyConnectionImpl(_ref) {
    var server = _ref.server,
        gameComponents = _ref.gameComponents,
        playerName = _ref.playerName,
        playerCredentials = _ref.playerCredentials;

    _classCallCheck(this, _LobbyConnectionImpl);

    this.gameComponents = gameComponents;
    this.playerName = playerName || 'Visitor';
    this.playerCredentials = playerCredentials;
    this.server = server;
    this.rooms = [];
  }

  _createClass(_LobbyConnectionImpl, [{
    key: "_baseUrl",
    value: function _baseUrl() {
      return "".concat(this.server || '', "/games");
    }
  }, {
    key: "refresh",
    value: async function refresh() {
      try {
        this.rooms.length = 0;
        var resp = await fetch(this._baseUrl());

        if (resp.status !== 200) {
          throw new Error('HTTP status ' + resp.status);
        }

        var json = await resp.json();

        var _iterator = _createForOfIteratorHelper(json),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var gameName = _step.value;
            if (!this._getGameComponents(gameName)) continue;
            var gameResp = await fetch(this._baseUrl() + '/' + gameName);
            var gameJson = await gameResp.json();

            var _iterator2 = _createForOfIteratorHelper(gameJson.rooms),
                _step2;

            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var inst = _step2.value;
                inst.gameName = gameName;
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }

            this.rooms = this.rooms.concat(gameJson.rooms);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      } catch (error) {
        throw new Error('failed to retrieve list of games (' + error + ')');
      }
    }
  }, {
    key: "_getGameInstance",
    value: function _getGameInstance(gameID) {
      var _iterator3 = _createForOfIteratorHelper(this.rooms),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var inst = _step3.value;
          if (inst['gameID'] === gameID) return inst;
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
  }, {
    key: "_getGameComponents",
    value: function _getGameComponents(gameName) {
      var _iterator4 = _createForOfIteratorHelper(this.gameComponents),
          _step4;

      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var comp = _step4.value;
          if (comp.game.name === gameName) return comp;
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    }
  }, {
    key: "_findPlayer",
    value: function _findPlayer(playerName) {
      var _iterator5 = _createForOfIteratorHelper(this.rooms),
          _step5;

      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var inst = _step5.value;
          if (inst.players.some(function (player) {
            return player.name === playerName;
          })) return inst;
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    }
  }, {
    key: "join",
    value: async function join(gameName, gameID, playerID) {
      try {
        var inst = this._findPlayer(this.playerName);

        if (inst) {
          throw new Error('player has already joined ' + inst.gameID);
        }

        inst = this._getGameInstance(gameID);

        if (!inst) {
          throw new Error('game instance ' + gameID + ' not found');
        }

        var resp = await fetch(this._baseUrl() + '/' + gameName + '/' + gameID + '/join', {
          method: 'POST',
          body: JSON.stringify({
            playerID: playerID,
            playerName: this.playerName
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (resp.status !== 200) throw new Error('HTTP status ' + resp.status);
        var json = await resp.json();
        inst.players[Number.parseInt(playerID)].name = this.playerName;
        this.playerCredentials = json.playerCredentials;
      } catch (error) {
        throw new Error('failed to join room ' + gameID + ' (' + error + ')');
      }
    }
  }, {
    key: "leave",
    value: async function leave(gameName, gameID) {
      try {
        var inst = this._getGameInstance(gameID);

        if (!inst) throw new Error('game instance not found');

        var _iterator6 = _createForOfIteratorHelper(inst.players),
            _step6;

        try {
          for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
            var player = _step6.value;

            if (player.name === this.playerName) {
              var resp = await fetch(this._baseUrl() + '/' + gameName + '/' + gameID + '/leave', {
                method: 'POST',
                body: JSON.stringify({
                  playerID: player.id,
                  credentials: this.playerCredentials
                }),
                headers: {
                  'Content-Type': 'application/json'
                }
              });

              if (resp.status !== 200) {
                throw new Error('HTTP status ' + resp.status);
              }

              delete player.name;
              delete this.playerCredentials;
              return;
            }
          }
        } catch (err) {
          _iterator6.e(err);
        } finally {
          _iterator6.f();
        }

        throw new Error('player not found in room');
      } catch (error) {
        throw new Error('failed to leave room ' + gameID + ' (' + error + ')');
      }
    }
  }, {
    key: "disconnect",
    value: async function disconnect() {
      var inst = this._findPlayer(this.playerName);

      if (inst) {
        await this.leave(inst.gameName, inst.gameID);
      }

      this.rooms = [];
      this.playerName = 'Visitor';
    }
  }, {
    key: "create",
    value: async function create(gameName, numPlayers) {
      try {
        var comp = this._getGameComponents(gameName);

        if (!comp) throw new Error('game not found');
        if (numPlayers < comp.game.minPlayers || numPlayers > comp.game.maxPlayers) throw new Error('invalid number of players ' + numPlayers);
        var resp = await fetch(this._baseUrl() + '/' + gameName + '/create', {
          method: 'POST',
          body: JSON.stringify({
            numPlayers: numPlayers
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (resp.status !== 200) throw new Error('HTTP status ' + resp.status);
      } catch (error) {
        throw new Error('failed to create room for ' + gameName + ' (' + error + ')');
      }
    }
  }]);

  return _LobbyConnectionImpl;
}();
/**
 * LobbyConnection
 *
 * Lobby model.
 *
 * @param {string}   server - '<host>:<port>' of the server.
 * @param {Array}    gameComponents - A map of Board and Game objects for the supported games.
 * @param {string}   playerName - The name of the player.
 * @param {string}   playerCredentials - The credentials currently used by the player, if any.
 *
 * Returns:
 *   A JS object that synchronizes the list of running game instances with the server and provides an API to create/join/start instances.
 */


function LobbyConnection(opts) {
  return new _LobbyConnectionImpl(opts);
}

var LobbyLoginForm = /*#__PURE__*/function (_React$Component) {
  _inherits(LobbyLoginForm, _React$Component);

  var _super = _createSuper(LobbyLoginForm);

  function LobbyLoginForm() {
    var _this;

    _classCallCheck(this, LobbyLoginForm);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _super.call.apply(_super, [this].concat(args));

    _defineProperty(_assertThisInitialized(_this), "state", {
      playerName: _this.props.playerName,
      nameErrorMsg: ''
    });

    _defineProperty(_assertThisInitialized(_this), "onClickEnter", function () {
      if (_this.state.playerName === '') return;

      _this.props.onEnter(_this.state.playerName);
    });

    _defineProperty(_assertThisInitialized(_this), "onKeyPress", function (event) {
      if (event.key === 'Enter') {
        _this.onClickEnter();
      }
    });

    _defineProperty(_assertThisInitialized(_this), "onChangePlayerName", function (event) {
      var name = event.target.value.trim();

      _this.setState({
        playerName: name,
        nameErrorMsg: name.length > 0 ? '' : 'empty player name'
      });
    });

    return _this;
  }

  _createClass(LobbyLoginForm, [{
    key: "render",
    value: function render() {
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
        className: "phase-title"
      }, "Choose a player name:"), /*#__PURE__*/React.createElement("input", {
        type: "text",
        value: this.state.playerName,
        onChange: this.onChangePlayerName,
        onKeyPress: this.onKeyPress
      }), /*#__PURE__*/React.createElement("span", {
        className: "buttons"
      }, /*#__PURE__*/React.createElement("button", {
        className: "buttons",
        onClick: this.onClickEnter
      }, "Enter")), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
        className: "error-msg"
      }, this.state.nameErrorMsg, /*#__PURE__*/React.createElement("br", null)));
    }
  }]);

  return LobbyLoginForm;
}(React.Component);

_defineProperty(LobbyLoginForm, "propTypes", {
  playerName: PropTypes.string,
  onEnter: PropTypes.func.isRequired
});

_defineProperty(LobbyLoginForm, "defaultProps", {
  playerName: ''
});

var LobbyRoomInstance = /*#__PURE__*/function (_React$Component) {
  _inherits(LobbyRoomInstance, _React$Component);

  var _super = _createSuper(LobbyRoomInstance);

  function LobbyRoomInstance() {
    var _this;

    _classCallCheck(this, LobbyRoomInstance);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _super.call.apply(_super, [this].concat(args));

    _defineProperty(_assertThisInitialized(_this), "_createSeat", function (player) {
      return player.name || '[free]';
    });

    _defineProperty(_assertThisInitialized(_this), "_createButtonJoin", function (inst, seatId) {
      return /*#__PURE__*/React.createElement("button", {
        key: 'button-join-' + inst.gameID,
        onClick: function onClick() {
          return _this.props.onClickJoin(inst.gameName, inst.gameID, '' + seatId);
        }
      }, "Join");
    });

    _defineProperty(_assertThisInitialized(_this), "_createButtonLeave", function (inst) {
      return /*#__PURE__*/React.createElement("button", {
        key: 'button-leave-' + inst.gameID,
        onClick: function onClick() {
          return _this.props.onClickLeave(inst.gameName, inst.gameID);
        }
      }, "Leave");
    });

    _defineProperty(_assertThisInitialized(_this), "_createButtonPlay", function (inst, seatId) {
      return /*#__PURE__*/React.createElement("button", {
        key: 'button-play-' + inst.gameID,
        onClick: function onClick() {
          return _this.props.onClickPlay(inst.gameName, {
            gameID: inst.gameID,
            playerID: '' + seatId,
            numPlayers: inst.players.length
          });
        }
      }, "Play");
    });

    _defineProperty(_assertThisInitialized(_this), "_createButtonSpectate", function (inst) {
      return /*#__PURE__*/React.createElement("button", {
        key: 'button-spectate-' + inst.gameID,
        onClick: function onClick() {
          return _this.props.onClickPlay(inst.gameName, {
            gameID: inst.gameID,
            numPlayers: inst.players.length
          });
        }
      }, "Spectate");
    });

    _defineProperty(_assertThisInitialized(_this), "_createInstanceButtons", function (inst) {
      var playerSeat = inst.players.find(function (player) {
        return player.name === _this.props.playerName;
      });
      var freeSeat = inst.players.find(function (player) {
        return !player.name;
      });

      if (playerSeat && freeSeat) {
        // already seated: waiting for game to start
        return _this._createButtonLeave(inst);
      }

      if (freeSeat) {
        // at least 1 seat is available
        return _this._createButtonJoin(inst, freeSeat.id);
      } // room is full


      if (playerSeat) {
        return /*#__PURE__*/React.createElement("div", null, [_this._createButtonPlay(inst, playerSeat.id), _this._createButtonLeave(inst)]);
      } // allow spectating


      return _this._createButtonSpectate(inst);
    });

    return _this;
  }

  _createClass(LobbyRoomInstance, [{
    key: "render",
    value: function render() {
      var room = this.props.room;
      var status = 'OPEN';

      if (!room.players.find(function (player) {
        return !player.name;
      })) {
        status = 'RUNNING';
      }

      return /*#__PURE__*/React.createElement("tr", {
        key: 'line-' + room.gameID
      }, /*#__PURE__*/React.createElement("td", {
        key: 'cell-name-' + room.gameID
      }, room.gameName), /*#__PURE__*/React.createElement("td", {
        key: 'cell-status-' + room.gameID
      }, status), /*#__PURE__*/React.createElement("td", {
        key: 'cell-seats-' + room.gameID
      }, room.players.map(this._createSeat).join(', ')), /*#__PURE__*/React.createElement("td", {
        key: 'cell-buttons-' + room.gameID
      }, this._createInstanceButtons(room)));
    }
  }]);

  return LobbyRoomInstance;
}(React.Component);

_defineProperty(LobbyRoomInstance, "propTypes", {
  room: PropTypes.shape({
    gameName: PropTypes.string.isRequired,
    gameID: PropTypes.string.isRequired,
    players: PropTypes.array.isRequired
  }),
  playerName: PropTypes.string.isRequired,
  onClickJoin: PropTypes.func.isRequired,
  onClickLeave: PropTypes.func.isRequired,
  onClickPlay: PropTypes.func.isRequired
});

var LobbyCreateRoomForm = /*#__PURE__*/function (_React$Component) {
  _inherits(LobbyCreateRoomForm, _React$Component);

  var _super = _createSuper(LobbyCreateRoomForm);

  function LobbyCreateRoomForm(props) {
    var _this;

    _classCallCheck(this, LobbyCreateRoomForm);

    _this = _super.call(this, props);
    /* fix min and max number of players */

    _defineProperty(_assertThisInitialized(_this), "state", {
      selectedGame: 0,
      numPlayers: 2
    });

    _defineProperty(_assertThisInitialized(_this), "_createGameNameOption", function (game, idx) {
      return /*#__PURE__*/React.createElement("option", {
        key: 'name-option-' + idx,
        value: idx
      }, game.game.name);
    });

    _defineProperty(_assertThisInitialized(_this), "_createNumPlayersOption", function (idx) {
      return /*#__PURE__*/React.createElement("option", {
        key: 'num-option-' + idx,
        value: idx
      }, idx);
    });

    _defineProperty(_assertThisInitialized(_this), "_createNumPlayersRange", function (game) {
      return _toConsumableArray(new Array(game.maxPlayers + 1).keys()).slice(game.minPlayers);
    });

    _defineProperty(_assertThisInitialized(_this), "onChangeNumPlayers", function (event) {
      _this.setState({
        numPlayers: Number.parseInt(event.target.value)
      });
    });

    _defineProperty(_assertThisInitialized(_this), "onChangeSelectedGame", function (event) {
      var idx = Number.parseInt(event.target.value);

      _this.setState({
        selectedGame: idx,
        numPlayers: _this.props.games[idx].game.minPlayers
      });
    });

    _defineProperty(_assertThisInitialized(_this), "onClickCreate", function () {
      _this.props.createGame(_this.props.games[_this.state.selectedGame].game.name, _this.state.numPlayers);
    });

    var _iterator = _createForOfIteratorHelper(props.games),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var game = _step.value;
        var game_details = game.game;

        if (!game_details.minPlayers) {
          game_details.minPlayers = 1;
        }

        if (!game_details.maxPlayers) {
          game_details.maxPlayers = 4;
        }

        console.assert(game_details.maxPlayers >= game_details.minPlayers);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    _this.state = {
      selectedGame: 0,
      numPlayers: props.games[0].game.minPlayers
    };
    return _this;
  }

  _createClass(LobbyCreateRoomForm, [{
    key: "render",
    value: function render() {
      var _this2 = this;

      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("select", {
        value: this.state.selectedGame,
        onChange: function onChange(evt) {
          return _this2.onChangeSelectedGame(evt);
        }
      }, this.props.games.map(this._createGameNameOption)), /*#__PURE__*/React.createElement("span", null, "Players:"), /*#__PURE__*/React.createElement("select", {
        value: this.state.numPlayers,
        onChange: this.onChangeNumPlayers
      }, this._createNumPlayersRange(this.props.games[this.state.selectedGame].game).map(this._createNumPlayersOption)), /*#__PURE__*/React.createElement("span", {
        className: "buttons"
      }, /*#__PURE__*/React.createElement("button", {
        onClick: this.onClickCreate
      }, "Create")));
    }
  }]);

  return LobbyCreateRoomForm;
}(React.Component);

_defineProperty(LobbyCreateRoomForm, "propTypes", {
  games: PropTypes.array.isRequired,
  createGame: PropTypes.func.isRequired
});

var LobbyPhases = {
  ENTER: 'enter',
  PLAY: 'play',
  LIST: 'list'
};
/**
 * Lobby
 *
 * React lobby component.
 *
 * @param {Array}  gameComponents - An array of Board and Game objects for the supported games.
 * @param {string} lobbyServer - Address of the lobby server (for example 'localhost:8000').
 *                               If not set, defaults to the server that served the page.
 * @param {string} gameServer - Address of the game server (for example 'localhost:8001').
 *                              If not set, defaults to the server that served the page.
 * @param {function} clientFactory - Function that is used to create the game clients.
 * @param {number} refreshInterval - Interval between server updates (default: 2000ms).
 * @param {bool}   debug - Enable debug information (default: false).
 *
 * Returns:
 *   A React component that provides a UI to create, list, join, leave, play or spectate game instances.
 */

var Lobby = /*#__PURE__*/function (_React$Component) {
  _inherits(Lobby, _React$Component);

  var _super = _createSuper(Lobby);

  function Lobby(_props) {
    var _this;

    _classCallCheck(this, Lobby);

    _this = _super.call(this, _props);

    _defineProperty(_assertThisInitialized(_this), "state", {
      phase: LobbyPhases.ENTER,
      playerName: 'Visitor',
      runningGame: null,
      errorMsg: '',
      credentialStore: {}
    });

    _defineProperty(_assertThisInitialized(_this), "_createConnection", function (props) {
      var name = _this.state.playerName;
      _this.connection = LobbyConnection({
        server: props.lobbyServer,
        gameComponents: props.gameComponents,
        playerName: name,
        playerCredentials: _this.state.credentialStore[name]
      });
    });

    _defineProperty(_assertThisInitialized(_this), "_updateCredentials", function (playerName, credentials) {
      _this.setState(function (prevState) {
        // clone store or componentDidUpdate will not be triggered
        var store = Object.assign({}, prevState.credentialStore);
        store[[playerName]] = credentials;
        return {
          credentialStore: store
        };
      });
    });

    _defineProperty(_assertThisInitialized(_this), "_updateConnection", async function () {
      await _this.connection.refresh();

      _this.forceUpdate();
    });

    _defineProperty(_assertThisInitialized(_this), "_enterLobby", function (playerName) {
      _this.setState({
        playerName: playerName,
        phase: LobbyPhases.LIST
      });
    });

    _defineProperty(_assertThisInitialized(_this), "_exitLobby", async function () {
      await _this.connection.disconnect();

      _this.setState({
        phase: LobbyPhases.ENTER,
        errorMsg: ''
      });
    });

    _defineProperty(_assertThisInitialized(_this), "_createRoom", async function (gameName, numPlayers) {
      try {
        await _this.connection.create(gameName, numPlayers);
        await _this.connection.refresh(); // rerender

        _this.setState({});
      } catch (error) {
        _this.setState({
          errorMsg: error.message
        });
      }
    });

    _defineProperty(_assertThisInitialized(_this), "_joinRoom", async function (gameName, gameID, playerID) {
      try {
        await _this.connection.join(gameName, gameID, playerID);
        await _this.connection.refresh();

        _this._updateCredentials(_this.connection.playerName, _this.connection.playerCredentials);
      } catch (error) {
        _this.setState({
          errorMsg: error.message
        });
      }
    });

    _defineProperty(_assertThisInitialized(_this), "_leaveRoom", async function (gameName, gameID) {
      try {
        await _this.connection.leave(gameName, gameID);
        await _this.connection.refresh();

        _this._updateCredentials(_this.connection.playerName, _this.connection.playerCredentials);
      } catch (error) {
        _this.setState({
          errorMsg: error.message
        });
      }
    });

    _defineProperty(_assertThisInitialized(_this), "_startGame", function (gameName, gameOpts) {
      var gameCode = _this.connection._getGameComponents(gameName);

      if (!gameCode) {
        _this.setState({
          errorMsg: 'game ' + gameName + ' not supported'
        });

        return;
      }

      var multiplayer = undefined;

      if (gameOpts.numPlayers > 1) {
        if (_this.props.gameServer) {
          multiplayer = SocketIO({
            server: _this.props.gameServer
          });
        } else {
          multiplayer = SocketIO();
        }
      }

      if (gameOpts.numPlayers == 1) {
        var maxPlayers = gameCode.game.maxPlayers;
        var bots = {};

        for (var i = 1; i < maxPlayers; i++) {
          bots[i + ''] = MCTSBot;
        }

        multiplayer = Local({
          bots: bots
        });
      }

      var app = _this.props.clientFactory({
        game: gameCode.game,
        board: gameCode.board,
        debug: _this.props.debug,
        multiplayer: multiplayer
      });

      var game = {
        app: app,
        gameID: gameOpts.gameID,
        playerID: gameOpts.numPlayers > 1 ? gameOpts.playerID : '0',
        credentials: _this.connection.playerCredentials
      };

      _this.setState({
        phase: LobbyPhases.PLAY,
        runningGame: game
      });
    });

    _defineProperty(_assertThisInitialized(_this), "_exitRoom", function () {
      _this.setState({
        phase: LobbyPhases.LIST,
        runningGame: null
      });
    });

    _defineProperty(_assertThisInitialized(_this), "_getPhaseVisibility", function (phase) {
      return _this.state.phase !== phase ? 'hidden' : 'phase';
    });

    _defineProperty(_assertThisInitialized(_this), "renderRooms", function (rooms, playerName) {
      return rooms.map(function (room) {
        var gameID = room.gameID,
            gameName = room.gameName,
            players = room.players;
        return /*#__PURE__*/React.createElement(LobbyRoomInstance, {
          key: 'instance-' + gameID,
          room: {
            gameID: gameID,
            gameName: gameName,
            players: Object.values(players)
          },
          playerName: playerName,
          onClickJoin: _this._joinRoom,
          onClickLeave: _this._leaveRoom,
          onClickPlay: _this._startGame
        });
      });
    });

    _this._createConnection(_this.props);

    setInterval(_this._updateConnection, _this.props.refreshInterval);
    return _this;
  }

  _createClass(Lobby, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var cookie = Cookies.load('lobbyState') || {};

      if (cookie.phase && cookie.phase === LobbyPhases.PLAY) {
        cookie.phase = LobbyPhases.LIST;
      }

      this.setState({
        phase: cookie.phase || LobbyPhases.ENTER,
        playerName: cookie.playerName || 'Visitor',
        credentialStore: cookie.credentialStore || {}
      });
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps, prevState) {
      var name = this.state.playerName;
      var creds = this.state.credentialStore[name];

      if (prevState.phase !== this.state.phase || prevState.credentialStore[name] !== creds || prevState.playerName !== name) {
        this._createConnection(this.props);

        this._updateConnection();

        var cookie = {
          phase: this.state.phase,
          playerName: name,
          credentialStore: this.state.credentialStore
        };
        Cookies.save('lobbyState', cookie, {
          path: '/'
        });
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props = this.props,
          gameComponents = _this$props.gameComponents,
          renderer = _this$props.renderer;
      var _this$state = this.state,
          errorMsg = _this$state.errorMsg,
          playerName = _this$state.playerName,
          phase = _this$state.phase,
          runningGame = _this$state.runningGame;

      if (renderer) {
        return renderer({
          errorMsg: errorMsg,
          gameComponents: gameComponents,
          rooms: this.connection.rooms,
          phase: phase,
          playerName: playerName,
          runningGame: runningGame,
          handleEnterLobby: this._enterLobby,
          handleExitLobby: this._exitLobby,
          handleCreateRoom: this._createRoom,
          handleJoinRoom: this._joinRoom,
          handleLeaveRoom: this._leaveRoom,
          handleExitRoom: this._exitRoom,
          handleRefreshRooms: this._updateConnection,
          handleStartGame: this._startGame
        });
      }

      return /*#__PURE__*/React.createElement("div", {
        id: "lobby-view",
        style: {
          padding: 50
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: this._getPhaseVisibility(LobbyPhases.ENTER)
      }, /*#__PURE__*/React.createElement(LobbyLoginForm, {
        key: playerName,
        playerName: playerName,
        onEnter: this._enterLobby
      })), /*#__PURE__*/React.createElement("div", {
        className: this._getPhaseVisibility(LobbyPhases.LIST)
      }, /*#__PURE__*/React.createElement("p", null, "Welcome, ", playerName), /*#__PURE__*/React.createElement("div", {
        className: "phase-title",
        id: "game-creation"
      }, /*#__PURE__*/React.createElement("span", null, "Create a room:"), /*#__PURE__*/React.createElement(LobbyCreateRoomForm, {
        games: gameComponents,
        createGame: this._createRoom
      })), /*#__PURE__*/React.createElement("p", {
        className: "phase-title"
      }, "Join a room:"), /*#__PURE__*/React.createElement("div", {
        id: "instances"
      }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("tbody", null, this.renderRooms(this.connection.rooms, playerName))), /*#__PURE__*/React.createElement("span", {
        className: "error-msg"
      }, errorMsg, /*#__PURE__*/React.createElement("br", null))), /*#__PURE__*/React.createElement("p", {
        className: "phase-title"
      }, "Rooms that become empty are automatically deleted.")), /*#__PURE__*/React.createElement("div", {
        className: this._getPhaseVisibility(LobbyPhases.PLAY)
      }, runningGame && /*#__PURE__*/React.createElement(runningGame.app, {
        gameID: runningGame.gameID,
        playerID: runningGame.playerID,
        credentials: runningGame.credentials
      }), /*#__PURE__*/React.createElement("div", {
        className: "buttons",
        id: "game-exit"
      }, /*#__PURE__*/React.createElement("button", {
        onClick: this._exitRoom
      }, "Exit game"))), /*#__PURE__*/React.createElement("div", {
        className: "buttons",
        id: "lobby-exit"
      }, /*#__PURE__*/React.createElement("button", {
        onClick: this._exitLobby
      }, "Exit lobby")));
    }
  }]);

  return Lobby;
}(React.Component);

_defineProperty(Lobby, "propTypes", {
  gameComponents: PropTypes.array.isRequired,
  lobbyServer: PropTypes.string,
  gameServer: PropTypes.string,
  debug: PropTypes.bool,
  clientFactory: PropTypes.func,
  refreshInterval: PropTypes.number
});

_defineProperty(Lobby, "defaultProps", {
  debug: false,
  clientFactory: Client,
  refreshInterval: 2000
});

export { Client, Lobby };
