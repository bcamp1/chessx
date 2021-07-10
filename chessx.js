const pieces = {
    NONE: ' ',
    KING: 'k',
    PAWN: 'p',
    QUEEN: 'q',
    ROOK: 'r',
    BISHOP: 'b',
    KNIGHT: 'n'
}

const colors = {
    BLACK: 'black',
    WHITE: 'white',
    NONE: 'none',
}

const occupancy = {
    ENEMY: 'enemy',
    FRIENDLY: 'friendly',
    EMPTY: 'empty',
    INVALID: 'invalid',
}

const direction = {
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical',
    DIAGPLUS: 'diagplus',
    DIAGMINUS: 'diagminus',
}

function enemyColor(color) {
    switch(color) {
        case colors.BLACK:
            return colors.WHITE
        case colors.WHITE:
            return colors.BLACK
    }

    throw 'invalid color ' + color
}

function pieceInfo(pieceData) {
    if (pieceData == ' ') {
        return {type: pieces.NONE, color: colors.NONE}
    }

    let color, piece
    if (pieceData.charCodeAt(0) >= 97) {
        color = colors.BLACK
    } else {
        color = colors.WHITE
    }

    piece = pieceData.toLowerCase()

    return {type: piece, color: color}
}


function infoTo(piece) {
    if (piece.color == colors.NONE || piece.type == pieces.NONE) {
        return ' '
    }

    if (piece.color == colors.BLACK) {
        return piece.type
    }

    return piece.type.toUpperCase()
}

function loc(locString) {
    var cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    var col = cols.findIndex(element => element === locString.charAt(0))
    var row = Number.parseInt(locString.charAt(1))

    var loc = {
        x: col,
        y: row - 1,
    }

    return loc
}

function toNotation(loc) {
    if (!isValid(loc)) {
        throw 'Invalid location'
    }
    var cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    return cols[loc.x] + (loc.y + 1).toString()
}

function toIndex(loc) {
    return (7-loc.y)*8 + loc.x
}

function isValid(loc) {
    return (loc.x >= 0 && loc.y >= 0 && loc.x <= 7 && loc.y <= 7)
}

function isEqual(loc1, loc2) {
    if (!isValid(loc1) || !isValid(loc2)) throw 'loc(s) not valid'
    var eval = toIndex(loc1) == toIndex(loc2)
    return eval
}

function indexToLoc(index) {
    var row = Math.floor(index / 8)
    var col = index % 8

    var loc = {
        x: col,
        y: 7 - row, 
    }

    return loc
}

function t(loc, dir, dist) {
    switch(dir) {
        case direction.HORIZONTAL:
            return {x: loc.x + dist, y: loc.y}
        case direction.VERTICAL:
            return {x: loc.x, y: loc.y + dist}
        case direction.DIAGPLUS:
            return {x: loc.x + dist, y: loc.y + dist}
        case direction.DIAGMINUS:
            return {x: loc.x + dist, y: loc.y - dist}
    }
    throw `loc: ${loc} dir: ${dir} dist: ${dist}`
}

function fromFEN(fenString) {
    var board = new BoardState()
    var arr = fenString.split(' ')
    var fen = arr[0]
    var data = []

    for (var i = 0; i < fen.length; i++) {
        var char = fen.charAt(i)
        var code = fen.charCodeAt(i)
        if (code >= 48 && code <= 57) {
            var num = Number.parseInt(char)
            for (var j = 0; j < num; j++) {
                data.push(' ')
            }
        } else if (code != 47) {
            data.push(char)
        }
    }

    board.data = data

    switch(arr[1]) {
        case 'w':
            board.turn = colors.WHITE
            break
        case 'b':
            board.turn = colors.BLACK
        break
    }

    var castling = arr[2]
    for (var i = 0; i < castling.length; i++) {
        switch(castling.charAt(i)) {
            case 'K':
                board.whiteCastleKing = true
                break
            case 'Q':
                board.whiteCastleQueen = true
                break
            case 'k':
                board.blackCastleKing = true
                break
            case 'q':
                board.blackCastleQueen = true
                break
        }
    }

    var moveStr = arr[5]
    board.moveNumber = Number.parseInt(moveStr)

    return board
}

function copyBoardState(boardState) {
    var newBoardState = new BoardState
    newBoardState.moveNumber = boardState.moveNumber
    newBoardState.turn = boardState.turn

    newBoardState.whiteCastleKing = boardState.whiteCastleKing
    newBoardState.whiteCastleQueen = boardState.whiteCastleKing
    newBoardState.blackCastleKing = boardState.whiteCastleKing
    newBoardState.blackCastleQueen = boardState.whiteCastleKing

    newBoardState.data = [...boardState.data]

    return newBoardState
}

class BoardState {
    constructor() {
        this.moveNumber = 0
        this.turn = colors.WHITE

        this.whiteCastleKing = false
        this.whiteCastleQueen = false
        this.blackCastleKing = false
        this.blackCastleQueen = false

        this.data = []

        for (let i = 0; i < 64; i++) {
            this.data.push(' ')
        }
    }

    print() {
        console.log('move ' + this.moveNumber)
        console.log(this.turn + ' to move')
        console.log('  ' + '-'.repeat(19))
        for (var i = 0; i < 8; i++) {
            let slice = this.data.slice(8*i, 8*i + 8)
            console.log((8-i) + ' | ' + slice.join(' ') + ' |')
        }
        console.log('  ' + '-'.repeat(19))
        console.log('    a b c d e f g h')
        console.log()

    }

    piece(loc) {
        return this.data[toIndex(loc)]
    }

    insert(piece, loc) {
        this.data[toIndex(loc)] = piece
    }

    remove(loc) {
        this.data[toIndex(loc)] = ' '
    }

    move(loc, loc2) {
        var piece = this.piece(loc)
        if (piece == ' ') {
            throw "Trying to move piece that doesn't exist"
        }

        this.insert(piece, loc2)
        this.remove(loc)
    }

    findKing(color) {
        var info = {
            type: pieces.KING,
            color: color
        }

        var piece = infoTo(info)
        var index = this.data.findIndex(element => element == piece)
        if (index == -1) throw 'king not found'
        var loc = indexToLoc(index)
        return loc
    }

    findColor(color) {
        var locs = []
        this.data.forEach((element, index) => {
            if (pieceInfo(element).color == color) {
                locs.push(indexToLoc(index))
            }
        })

        return locs
    }

    getOccupancy(loc, color) {

        if (!isValid(loc)) return occupancy.INVALID
        var info = pieceInfo(this.piece(loc))
        if (info.color == colors.NONE) return occupancy.EMPTY
        if (info.color == color) return occupancy.FRIENDLY
        if (info.color == enemyColor(color)) return occupancy.ENEMY
        throw `loc: ${loc}, color: ${color}`
    }

    traverse(loc, dir) {
        var path = []
        if (!isValid(loc)) throw 'loc not valid'

        var info = pieceInfo(this.piece(loc))

        var dist = 0
        var done = false

        while (!done) {
            dist += 1
            var transformed = t(loc, dir, dist)
            switch (this.getOccupancy(transformed, info.color)) {
                case occupancy.FRIENDLY:
                    done = true
                    break
                case occupancy.ENEMY:
                    path.push(transformed)
                    done = true
                    break
                case occupancy.INVALID:
                    done = true
                    break
                case occupancy.EMPTY:
                    path.push(transformed)
                    break
            }
        }

        done = false
        dist = 0

        while (!done) {
            dist -= 1
            var transformed = t(loc, dir, dist)
            switch (this.getOccupancy(transformed, info.color)) {
                case occupancy.FRIENDLY:
                    done = true
                    break
                case occupancy.ENEMY:
                    path.push(transformed)
                    done = true
                    break
                case occupancy.INVALID:
                    done = true
                    break
                case occupancy.EMPTY:
                    path.push(transformed)
                    break
            }
        }

        return path
    }
}

class Game {
    constructor(initialBoardState) {
        this.move = 1
        this.turn = colors.WHITE
        this.history = [initialBoardState]
    }

    toPGNMove(boardState, loc, loc2) {
        var piece = boardState.piece(loc)
        if (piece == ' ') {
            throw "Trying to move piece that doesn't exist"
        }

        var pieceLetter = piece.toUpperCase()
        if (pieceLetter == 'P') pieceLetter = ''
        var notation = toNotation(loc2)

        var info = pieceInfo(piece)
        var oc = boardState.getOccupancy(loc2, info.color)

        if (oc == occupancy.EMPTY) {
            return pieceLetter + notation
        } else if (oc == occupancy.ENEMY) {
            if (info.type == pieces.PAWN) {
                return toNotation(loc).charAt(0) + 'x' + notation
            }
            return pieceLetter + 'x' + notation
        } else {
            return pieceLetter + '?' + notation
        }  
    }

    toPGNMoveSet(boardState, loc, options) {
        var moveSet = []
        options.forEach(option => {
            moveSet.push(this.toPGNMove(boardState, loc, option))
        })
        return moveSet
    }

    getRawPGNMoves(boardState, loc) {
        var options = this.getRawMoves(boardState, loc)
        var moveSet = this.toPGNMoveSet(boardState, loc, options)
        return moveSet
    }

    isKingInCheck(boardState, color) {
        var kingLoc = boardState.findKing(color)
        var enemyLocs = boardState.findColor(enemyColor(color))
        var enemyIndexes = enemyLocs.map(value => toIndex(value))
        var matrix = this.getRawMoveMatrix(boardState)

        for (var j = 0; j < enemyIndexes.length; j++) {
            var index = enemyIndexes[j]
            var moveSet = matrix[index]
            var found = moveSet.findIndex(move => isEqual(move, kingLoc))
            if (found != -1) return true
        }   

        return false

    }

    getLegalMoveMatrix(boardState) {
        var matrix = []

        for (var i = 0; i < 64; i++) {
            matrix[i] = this.getLegalMoves(boardState, indexToLoc(i))
        }

        return matrix
    }

    getLegalMoves(boardState, loc) {
        var info = pieceInfo(boardState.piece(loc))
        var legalMoves = []
        var rawMoves = this.getRawMoves(boardState, loc)
        rawMoves.forEach(rawMove => {
            var theoreticalBoard = copyBoardState(boardState)
            theoreticalBoard.move(loc, rawMove)
            if (!this.isKingInCheck(theoreticalBoard, info.color)) {
                legalMoves.push(rawMove)
            }
        })

        return legalMoves
    }

    getRawMoveMatrix(boardState) {
        var matrix = []

        for (var i = 0; i < 64; i++) {
            matrix[i] = this.getRawMoves(boardState, indexToLoc(i))
        }

        return matrix
    }

    getRawMoves(boardState, loc) {
        var moves = []

        if (boardState.piece(loc) == ' ') return []

        var info = pieceInfo(boardState.piece(loc))
        
        switch (info.type) {
            case pieces.PAWN:
                var push1, push2, captureLeft, captureRight
                if (info.color == colors.BLACK) {
                    push1 = t(loc, direction.VERTICAL, -1)
                    push2 = t(loc, direction.VERTICAL, -2)
                    captureLeft = t(loc, direction.DIAGMINUS, 1)
                    captureRight = t(loc, direction.DIAGPLUS, -1)
                } else {
                    push1 = t(loc, direction.VERTICAL, 1)
                    push2 = t(loc, direction.VERTICAL, 2)
                    captureLeft = t(loc, direction.DIAGMINUS, -1)
                    captureRight = t(loc, direction.DIAGPLUS, 1)
                }

                if (boardState.getOccupancy(push1, info.color) == occupancy.EMPTY) {
                    moves.push(push1)

                    if (boardState.getOccupancy(push2, info.color) == occupancy.EMPTY) {
                        if ((info.color == colors.BLACK && loc.y == 6) || (info.color == colors.WHITE && loc.y == 1)) {
                            moves.push(push2)
                        }
                    }
                }

                if (boardState.getOccupancy(captureLeft, info.color) == occupancy.ENEMY) {
                    moves.push(captureLeft)
                }
                if (boardState.getOccupancy(captureRight, info.color) == occupancy.ENEMY) {
                    moves.push(captureRight)
                }
                break
            case pieces.KING:
                [
                    t(loc, direction.VERTICAL, 1),
                    t(loc, direction.VERTICAL, -1),
                    t(loc, direction.HORIZONTAL, 1),
                    t(loc, direction.HORIZONTAL, -1),
                    t(loc, direction.DIAGPLUS, 1),
                    t(loc, direction.DIAGPLUS, -1),
                    t(loc, direction.DIAGMINUS, 1),
                    t(loc, direction.DIAGMINUS, -1),
                ].forEach(potentialMove => {
                    var oc = boardState.getOccupancy(potentialMove, info.color)
                    if (oc == occupancy.EMPTY || oc == occupancy.ENEMY) {
                        moves.push(potentialMove)
                    }
                })
                break
            case pieces.BISHOP:
                moves = moves.concat(boardState.traverse(loc, direction.DIAGPLUS))
                moves = moves.concat(boardState.traverse(loc, direction.DIAGMINUS))
                break
            case pieces.KNIGHT:
                [
                    {x: loc.x - 1, y: loc.y + 2},
                    {x: loc.x + 1, y: loc.y + 2},
                    {x: loc.x - 2, y: loc.y + 1},
                    {x: loc.x + 2, y: loc.y + 1},
                    {x: loc.x - 2, y: loc.y - 1},
                    {x: loc.x + 2, y: loc.y - 1},
                    {x: loc.x - 1, y: loc.y - 2},
                    {x: loc.x + 1, y: loc.y - 2},
                ].forEach(potentialMove => {
                    var oc = boardState.getOccupancy(potentialMove, info.color)
                    if (oc == occupancy.EMPTY || oc == occupancy.ENEMY) {
                        moves.push(potentialMove)
                    }
                })
                break
            case pieces.ROOK:
                moves = moves.concat(boardState.traverse(loc, direction.HORIZONTAL))
                moves = moves.concat(boardState.traverse(loc, direction.VERTICAL))
                break
            case pieces.QUEEN:
                moves = moves.concat(boardState.traverse(loc, direction.DIAGPLUS))
                moves = moves.concat(boardState.traverse(loc, direction.DIAGMINUS))
                moves = moves.concat(boardState.traverse(loc, direction.HORIZONTAL))
                moves = moves.concat(boardState.traverse(loc, direction.VERTICAL))
                break
            case pieces.NONE:
                throw 'invalid piece'

        }

        return moves
    }


}

var boardState = fromFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
boardState.move(loc('e2'), loc('e4'))
boardState.move(loc('f2'), loc('f4'))
boardState.move(loc('g2'), loc('g4'))
boardState.move(loc('b7'), loc('b5'))
boardState.move(loc('d1'), loc('e5'))

boardState.move(loc('h8'), loc('e3'))
boardState.move(loc('e1'), loc('d1'))
boardState.move(loc('a8'), loc('d6'))
var game = new Game(boardState)
game.history[0].print()

var mat = game.getLegalMoveMatrix(boardState)

mat.forEach((elem, index) => {
    var loc = indexToLoc(index)
    if (elem.length != 0) {
        console.log(toNotation(loc) + ': ' + elem.map(value => game.toPGNMove(boardState, loc, value)).join(' '))
    }
})




