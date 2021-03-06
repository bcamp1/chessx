import input from 'input';
import { Timer } from 'timer-node';

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

const castleDir = {
    KINGSIDE: 'O-O',
    QUEENSIDE: 'O-O-O',
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
    if (loc1 == null || loc2 == null) return false
    //if (!isValid(loc1) || !isValid(loc2)) throw 'loc(s) not valid'
    return toIndex(loc1) == toIndex(loc2)
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
                board.castlePrivs[colors.WHITE][castleDir.KINGSIDE] = true
                break
            case 'Q':
                board.castlePrivs[colors.WHITE][castleDir.QUEENSIDE] = true
                break
            case 'k':
                board.castlePrivs[colors.BLACK][castleDir.KINGSIDE] = true
                break
            case 'q':
                board.castlePrivs[colors.BLACK][castleDir.QUEENSIDE] = true
                break
        }
    }

    var enPassantInfo = arr[3]

    if (enPassantInfo == '-') {
        board.enPassant = null
    } else {
        board.enPassant = loc(enPassantInfo)
    }

    var moveStr = arr[5]
    board.moveNumber = Number.parseInt(moveStr)

    return board
}

function copyBoardState(boardState) {
    var newBoardState = new BoardState
    newBoardState.moveNumber = boardState.moveNumber
    newBoardState.turn = boardState.turn

    newBoardState.castlePrivs = JSON.parse(JSON.stringify(boardState.castlePrivs))
    newBoardState.castleAbility = JSON.parse(JSON.stringify(boardState.castleAbility))

    if (boardState.enPassant == null) {
        newBoardState.enPassant = null
    } else {
        newBoardState.enPassant = {x: boardState.enPassant.x, y: boardState.enPassant.y}
    }

    newBoardState.data = [...boardState.data]

    return newBoardState
}

class BoardState {
    constructor() {
        this.moveNumber = 0
        this.turn = colors.WHITE

        this.castlePrivs = {
            'white': {
                'O-O': false,
                'O-O-O': false,
            },
            'black': {
                'O-O': false,
                'O-O-O': false,
            }
        }

        this.castleAbility = {
            'white': {
                'O-O': false,
                'O-O-O': false,
            },
            'black': {
                'O-O': false,
                'O-O-O': false,
            }
        }

        this.enPassant = null

        this.data = []

        for (let i = 0; i < 64; i++) {
            this.data.push(' ')
        }
    }

    print() {
        console.log('move ' + this.moveNumber)
        console.log(this.turn + ' to move')
        var enPassantString = '-'
        if (this.enPassant != null) {
            enPassantString = toNotation(this.enPassant)
        }
        console.log('en passant: ' + enPassantString)
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
            throw "boardState.move: Trying to move piece that doesn't exist"
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

        this.history[0].castleAbility[colors.WHITE][castleDir.KINGSIDE] = this.canKingCastle(boardState, colors.WHITE, castleDir.KINGSIDE)
        this.history[0].castleAbility[colors.WHITE][castleDir.QUEENSIDE] = this.canKingCastle(boardState, colors.WHITE, castleDir.QUEENSIDE)
        this.history[0].castleAbility[colors.BLACK][castleDir.KINGSIDE] = this.canKingCastle(boardState, colors.BLACK, castleDir.KINGSIDE)
        this.history[0].castleAbility[colors.BLACK][castleDir.QUEENSIDE] = this.canKingCastle(boardState, colors.BLACK, castleDir.QUEENSIDE)
    }

    toPGNMove(boardState, loc1, loc2) {
        var piece = boardState.piece(loc1)
        if (piece == ' ') {
            throw "toPGNMove: Trying to move piece that doesn't exist"
        }

        var pieceLetter = piece.toUpperCase()
        var notation = toNotation(loc2)
        var info = pieceInfo(piece)
        var oc = boardState.getOccupancy(loc2, info.color)


        // Castle
        if (pieceLetter == 'K') {
            if (info.color == colors.WHITE) {
                if (isEqual(loc1, loc('e1'))) {
                    if (isEqual(loc2, loc('g1'))) {
                        return 'O-O'
                    } else if (isEqual(loc2, loc('c1'))) {
                        return 'O-O-O'
                    }
                }
            } else if (info.color == colors.BLACK) {
                if (isEqual(loc1, loc('e8'))) {
                    if (isEqual(loc2, loc('g8'))) {
                        return 'O-O'
                    } else if (isEqual(loc2, loc('c8'))) {
                        return 'O-O-O'
                    }
                }
            }
        }


        if (pieceLetter == 'P') pieceLetter = ''
        
        if (oc == occupancy.EMPTY) {
            return pieceLetter + notation
        } else if (oc == occupancy.ENEMY) {
            if (info.type == pieces.PAWN) {
                return toNotation(loc1).charAt(0) + 'x' + notation
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

    isKingInCheckMate(boardState, color) {
        var mat = this.getLegalMoveMatrixOfColor(boardState, color)
        var dict = this.getPGNDictionary(boardState, mat)
        return Object.keys(dict) == 0 && this.isKingInCheck(boardState, color)
    }

    isKingInStaleMate(boardState, color) {
        var mat = this.getLegalMoveMatrixOfColor(boardState, color)
        var dict = this.getPGNDictionary(boardState, mat)
        return Object.keys(dict) == 0 && !this.isKingInCheck(boardState, color)
    }

    canKingCastle(boardState, color, dir) {
        if (!boardState.castlePrivs[color][dir]) return false
        if (this.isKingInCheck(boardState, color)) return false

        var loc1, loc2, loc3, rookLoc
        var emptyLocs
        switch (color) {
            case colors.BLACK:
                loc1 = loc('e8')
                if (dir == castleDir.KINGSIDE) {
                    loc2 = loc('f8')
                    loc3 = loc('g8')
                    rookLoc = loc('h8')
                    emptyLocs = [loc('f8'), loc('g8')]
                } else {
                    loc2 = loc('d8')
                    loc3 = loc('c8')
                    rookLoc = loc('a8')
                    emptyLocs = [loc('d8'), loc('c8'), loc('b8')]
                }
            break
            case colors.WHITE:
                loc1 = loc('e1')
                if (dir == castleDir.KINGSIDE) {
                    loc2 = loc('f1')
                    loc3 = loc('g1')
                    rookLoc = loc('h1')
                    emptyLocs = [loc('f1'), loc('g1')]
                } else {
                    loc2 = loc('d1')
                    loc3 = loc('c1')
                    rookLoc = loc('a1')
                    emptyLocs = [loc('d1'), loc('c1'), loc('b1')]
                }
            break
        }



        // 1 - King in correct place
        if (!isEqual(boardState.findKing(color), loc1)) return false

        // 2 - Rook in correct place
        var rookInfo = pieceInfo(boardState.piece(rookLoc))
        if (rookInfo.type != pieces.ROOK || rookInfo.color != color) return false

        // 3 - No pieces between king and rook
        for (var i = 0; i < emptyLocs.length; i++) {
            var emptyLoc = emptyLocs[i]
            if (boardState.piece(emptyLoc) != ' ') return false
        }

        // 4 - King not under attack on passing square (loc2)
        var theoretical1 = this.processRawMove(boardState, loc1, loc2)
        if (this.isKingInCheck(theoretical1, color)) return false

        // 5 - King not under attack on final square (loc3)
        var theoretical2 = this.processRawMove(boardState, loc1, loc3)
        if (this.isKingInCheck(theoretical2, color)) return false

        return true
    }

    castleEndLoc(color, dir) {
        switch (color) {
            case colors.BLACK:
                if (dir == castleDir.KINGSIDE) {
                    return loc('g8')
                } else if (dir == castleDir.QUEENSIDE) {
                    return loc('c8')
                } else {
                    throw 'invalid castleDir ' + dir
                }
            break
            case colors.WHITE:
                if (dir == castleDir.KINGSIDE) {
                    return loc('g1')
                } else if (dir == castleDir.QUEENSIDE) {
                    return loc('c1')
                } else {
                    throw 'invalid castleDir ' + dir
                }
            break
        }
        throw 'Invalid color ' + color
    }

    getPGNDictionary(boardState, matrix) {
        var dict = {}
        for (var i = 0; i < 64; i++) {
            var loc = indexToLoc(i)
            var moves = matrix[i]
            moves.forEach(loc2 => {
                var PGN = this.toPGNMove(boardState, loc, loc2)
                dict[PGN] = {
                    loc: loc,
                    loc2: loc2,
                }
            })
        }

        return dict
    }

    getLegalMoveMatrixOfColor(boardState, color) {
        var matrix = []

        for (var i = 0; i < 64; i++) {
            var loc = indexToLoc(i)
            var piece = boardState.piece(loc)
            var info = pieceInfo(piece)
            if (info.color == color) {
                matrix[i] = this.getLegalMoves(boardState, indexToLoc(i))
            } else {
                matrix[i] = []
            }
        }

        return matrix
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
            // var theoreticalBoard = copyBoardState(boardState)
            // theoreticalBoard.move(loc, rawMove)
            //console.log('checking ' + this.toPGNMove(boardState, loc, rawMove))

            var theoreticalBoard = this.processMove(boardState, loc, rawMove)
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

                var onPromotionRow = (info.color == colors.BLACK && loc.y == 1) || (info.color == colors.WHITE && loc.y == 6)

                var leftOc = boardState.getOccupancy(captureLeft, info.color)
                var rightOc = boardState.getOccupancy(captureRight, info.color)

                if (leftOc == occupancy.ENEMY || isEqual(captureLeft, boardState.enPassant)) {
                    moves.push(captureLeft)
                } 

                if (rightOc == occupancy.ENEMY || isEqual(captureRight, boardState.enPassant)) {
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

                // Castling
                //console.log('calling canKingCastle')
                if (boardState.castleAbility[info.color][castleDir.KINGSIDE]) {
                    moves.push(this.castleEndLoc(info.color, castleDir.KINGSIDE))
                }

                if (boardState.castleAbility[info.color][castleDir.QUEENSIDE]) {
                    moves.push(this.castleEndLoc(info.color, castleDir.QUEENSIDE))
                }
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

    processRawMove(bs, loc, loc2) {
        var boardState = copyBoardState(bs)

        var piece = boardState.piece(loc)
        var info = pieceInfo(piece)
        if (piece == ' ') {
            console.log('ERROR')
            console.log(`loc: ${toNotation(loc)}, loc2: ${toNotation(loc2)}`)
            boardState.print()
            throw "processMove: Trying to move piece that doesn't exist"
        }

        boardState.move(loc, loc2)

        return copyBoardState(boardState)

    }

    processMove(bs, loc1, loc2, checkCastling = false) {
        var boardState = copyBoardState(bs)

        var piece = boardState.piece(loc1)
        var info = pieceInfo(piece)
        if (piece == ' ') {
            console.log('ERROR')
            console.log(`loc1: ${toNotation(loc1)}, loc2: ${toNotation(loc2)}`)
            boardState.print()
            throw "processMove: Trying to move piece that doesn't exist"
        }

        
        if (info.type == pieces.PAWN) {
            
            if (isEqual(boardState.enPassant, loc2)) {
                console.log('capturing en passant')
                // En Passant - Capturing
                var captureLoc
                if (info.color == colors.WHITE) {
                    captureLoc = {x: boardState.enPassant.x, y: boardState.enPassant.y - 1}
                } else {
                    captureLoc = {x: boardState.enPassant.x, y: boardState.enPassant.y + 1}
                }

                if (pieceInfo(boardState.piece(captureLoc)).type != pieces.PAWN) {
                    throw 'en passant - captured pawn not found on ' + toNotation(captureLoc)
                }

                boardState.remove(captureLoc)
                boardState.enPassant = null
            } else {
                // En Passant - Enabling
                if (isEqual(loc2, t(loc1, direction.VERTICAL, 2))) {
                    boardState.enPassant = t(loc1, direction.VERTICAL, 1)
                } else if (isEqual(loc2, t(loc1, direction.VERTICAL, -2))) {
                    boardState.enPassant = t(loc1, direction.VERTICAL, -1)
                } else {
                    boardState.enPassant = null
                }
            }   
        } else {
            boardState.enPassant = null
        }
        
        if (checkCastling) {
            // Set castle ability
            boardState.castleAbility[colors.WHITE][castleDir.KINGSIDE] = this.canKingCastle(boardState, colors.WHITE, castleDir.KINGSIDE)
            boardState.castleAbility[colors.WHITE][castleDir.QUEENSIDE] = this.canKingCastle(boardState, colors.WHITE, castleDir.QUEENSIDE)
            boardState.castleAbility[colors.BLACK][castleDir.KINGSIDE] = this.canKingCastle(boardState, colors.BLACK, castleDir.KINGSIDE)
            boardState.castleAbility[colors.BLACK][castleDir.QUEENSIDE] = this.canKingCastle(boardState, colors.BLACK, castleDir.QUEENSIDE)
        

            // castle privs
            if (info.type == pieces.KING) {
                boardState.castlePrivs[info.color][castleDir.KINGSIDE] = false
                boardState.castlePrivs[info.color][castleDir.QUEENSIDE] = false
            }

            if (boardState.piece(loc('a1')) != 'R') {
                boardState.castlePrivs[colors.WHITE][castleDir.QUEENSIDE] = false
            }
            if (boardState.piece(loc('h1')) != 'R') {
                boardState.castlePrivs[colors.WHITE][castleDir.KINGSIDE] = false
            }
            if (boardState.piece(loc('a8')) != 'r') {
                boardState.castlePrivs[colors.BLACK][castleDir.QUEENSIDE] = false
            }
            if (boardState.piece(loc('h8')) != 'r') {
                boardState.castlePrivs[colors.BLACK][castleDir.KINGSIDE] = false
            }

        }

        boardState.move(loc1, loc2)

        return copyBoardState(boardState)

    }

    async makeMove(boardState, color) {
        boardState.print()
        var valid = false

        const timer = new Timer({ label: 'test-timer' });
        timer.start()

        // Generate dictionary
        var mat = this.getLegalMoveMatrixOfColor(boardState, color)
        var dict = this.getPGNDictionary(boardState, mat)

        console.log(timer.ms())

        while (!valid) {
            var move = await input.text('Please enter a move: ')
            move = move.trim()
            if (move in dict) {
                var newBoardState = this.processMove(boardState, dict[move].loc, dict[move].loc2, true)
                return newBoardState
            } else {
                console.log('Invalid move. Legal moves are: ' + Object.keys(dict).join(', '))
            }
        }
    }

    async playCLIGame(initialBoardState) {
        this.move = 1
        this.turn = colors.WHITE
        this.history = [initialBoardState]
        var done = false
        while (!done) {
            if (this.isKingInCheckMate(this.history[this.history.length - 1], this.turn)) {
                console.log('CHECKMATE - ' + enemyColor(this.turn) + ' wins!')
                return
            } else if (this.isKingInStaleMate(this.history[this.history.length - 1], this.turn)) {
                console.log('STALEMATE - draw!')
                return
            }
            
            var castleKing = this.canKingCastle(this.history[this.history.length - 1], this.turn, castleDir.KINGSIDE)
            var castleQueen = this.canKingCastle(this.history[this.history.length - 1], this.turn, castleDir.QUEENSIDE)
            
            console.log('Can castle short? ' + castleKing)
            console.log('Can castle long? ' + castleQueen)

            var newBoardState = await this.makeMove(this.history[this.history.length - 1], this.turn)
            if (this.turn == colors.BLACK) {
                this.move += 1
            }
            this.turn = enemyColor(this.turn)
            newBoardState.moveNumber = this.move
            newBoardState.turn = this.turn
            this.history.push(newBoardState)
        }
        
    }


}

//var boardState = fromFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
var boardState = fromFEN('rnbqk2r/pppp1ppp/3b1n2/4p3/4P3/3B1N2/PPPP1PPP/RNBQK2R w KQkq - 4 4')

var game = new Game(boardState)
game.playCLIGame(boardState).then(() => {
    console.log('Game finished.')
}).catch(error => {
    console.error('CLIGame Error: ' + error)
})






