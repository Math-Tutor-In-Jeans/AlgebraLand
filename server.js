const express = require('express');
const cors = require('cors');
const { createConnection } = require('mysql2/promise');

const app = express();
app.use(express.json());
app.use(cors());
app.get('/ping', (req, res) => {
    res.status(200).json({ message: 'pong' });
});
async function initializeConnection() {
    try {
        const connection = await createConnection({
            host: process.env.DB_HOST || 'cloud.beaconbay.com',
            user: 'coinzone_MTIJ',
            password: 'AlpineBoredom16',
            database: 'coinzone_mydb'
        });
        console.log('Connected to MySQL!');
        return connection;
    } catch (error) {
        console.error('Error connecting to MySQL:', error);
        throw error;
    }
}

app.post('/createPlayer', async (req, res) => {
    console.log('Received a POST request to /createPlayer');
    const { userEMAIL, userName, userPass } = req.body;
    console.log('Received data:', req.body);

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        let currentPlace;
        let isUnique = false;
        do {
            currentPlace = Math.floor(Math.random() * 100000000);
            const query = 'SELECT COUNT(*) AS count FROM user_info WHERE userID = ?';
            const [rows] = await connection.execute(query, [currentPlace]);
            isUnique = rows[0].count === 0;
        } while (!isUnique);

        const query = `
            INSERT INTO user_info (userID, userEMAIL, userName, userPass, userCoins, frog_PacksCT, horse_PacksCT, rhino_PacksCT, wild_PacksCT)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [currentPlace, userEMAIL, userName, userPass, 300, 4, 0, 0, 0];
        console.log('Executing query:', query, values);
        const [result] = await connection.execute(query, values);
        console.log('Player added successfully:', result);
        res.json({ message: 'Player added successfully', result });
    } catch (error) {
        console.error('Error adding player:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Duplicate entry', details: error.message });
        } else {
            res.status(500).json({ error: 'Error adding player', details: error.message });
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/enterCardToDB', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { card, thePlayerID } = req.body;
    console.log('Entering card into DataBase for player ID:', thePlayerID);

    if (!card || !thePlayerID) {
        return res.status(400).json({ error: 'card and thePlayerID are required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        let cardID;
        let isUnique = false;
        do {
            cardID = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0');
            const query = 'SELECT COUNT(*) AS count FROM card_info WHERE card_ID = ?';
            const [rows] = await connection.execute(query, [cardID]);
            isUnique = rows[0].count === 0;
        } while (!isUnique);

        const columns = ['card_ID', 'user_ID', 'card_SET', 'image_URL', 'card_Name', 'flavor_TEXT', 
            'card_Cost', 'card_Color', 'card_Attack', 'card_Defense', 'rarity', 'card_Ability1', 'card_Ability2' ];

        // Ensure the card array has the correct number of items
        const values = [cardID, thePlayerID, ...card];
        while (values.length < columns.length) {
            values.push(null); // Fill missing values with null
        }
        const placeholders = columns.map(() => '?').join(', ');

        const query = `INSERT INTO card_info (${columns.join(', ')}) VALUES (${placeholders})`;
        console.log('Executing query:', query, values);
        const [result] = await connection.execute(query, values);
        console.log('Card added successfully:', result);
        res.json({ cardID });
    } catch (error) {
        console.error('Error adding card:', error);
        res.status(500).json({ error: 'Error adding card', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/checkUserName', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { userName } = req.body;
    console.log('Checking for userName:', userName);

    if (!userName) {
        return res.status(400).json({ error: 'userName is required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        const query = 'SELECT COUNT(*) AS count FROM user_info WHERE userName = ?';
        const [rows] = await connection.execute(query, [userName]);

        const exists = rows[0].count > 0;
        console.log('User exists:', exists);

        res.json({ exists });
    } catch (error) {
        console.error('Error checking userName:', error);
        res.status(500).json({ error: 'Error checking userName', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});
app.post('/checkEMAIL', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { userEMAIL } = req.body;
    console.log('Checking for email:', userEMAIL);

    if (!userEMAIL) {
        return res.status(400).json({ error: 'e-mail is required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        const query = 'SELECT COUNT(*) AS count FROM user_info WHERE userEMAIL = ?';
        const [rows] = await connection.execute(query, [userEMAIL]);

        const exists = rows[0].count > 0;
        console.log('User exists:', exists);

        res.json({ exists });
    } catch (error) {
        console.error('Error checking userEMAIL:', error);
        res.status(500).json({ error: 'Error checking userEMAIL', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});
app.post('/checkPassword', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { userName, userPass } = req.body;
    console.log('Checking for userName:', userName, 'and userPass:', userPass);

    if (!userName || !userPass) {
        return res.status(400).json({ error: 'userName and userPass are required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        const query = 'SELECT COUNT(*) AS count FROM user_info WHERE userName = ? AND userPass = ?';
        const [rows] = await connection.execute(query, [userName, userPass]);

        if (rows[0].count > 0) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error checking userPass:', error);
        res.status(500).json({ error: 'Error checking userPass', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/checkPassWemail', async (req, res) => {
    console.log('made it to checkPassWemail');
    console.log('Received request body:', req.body); // Log the request body
    
    // Log the keys of req.body to see what properties are present
    console.log('Request body keys:', Object.keys(req.body));

    const { userEMAIL, userPass } = req.body;
    console.log('Checking for userEMAIL:', userEMAIL, 'and userPass:', userPass);

    if (!userEMAIL || !userPass) {
        return res.status(400).json({ error: 'userEMAIL and userPass are required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        const query = 'SELECT COUNT(*) AS count FROM user_info WHERE userEMAIL = ? AND userPass = ?';
        const [rows] = await connection.execute(query, [userEMAIL, userPass]);

        if (rows[0].count > 0) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error checking userPass:', error);
        res.status(500).json({ error: 'Error checking userPass', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/getUserFromEmail', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { userEMAIL } = req.body;
    console.log('Checking for userEMAIL:', userEMAIL);

    if (!userEMAIL) {
        return res.status(400).json({ error: 'userEMAIL is required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        const query = 'SELECT userName FROM user_info WHERE userEMAIL = ?';
        const [rows] = await connection.execute(query, [userEMAIL]);

        if (rows.length > 0) {
            res.json({ userName: rows[0].userName });
        } else {
            res.json({ userName: null });
        }
    } catch (error) {
        console.error('Error checking userEMAIL:', error);
        res.status(500).json({ error: 'Error checking userEMAIL', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/getPlayerIDfromUserName', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { theName } = req.body;
    console.log('Checking for userName:', theName);

    if (!theName) {
        return res.status(400).json({ error: 'userName is required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        const query = 'SELECT userID FROM user_info WHERE userName = ?';
        const [rows] = await connection.execute(query, [theName]);

        if (rows.length > 0) {
            res.json({ userID: rows[0].userID });
        } else {
            res.json({ userID: null });
        }
    } catch (error) {
        console.error('Error checking userName:', error);
        res.status(500).json({ error: 'Error checking userName', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/updateCollection', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { thePlayerID } = req.body;
    console.log('Updating collection for player ID:', thePlayerID);

    if (!thePlayerID) {
        return res.status(400).json({ error: 'thePlayerID is required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        const query = 'SELECT * FROM card_info WHERE user_ID = ?';
        const [rows] = await connection.execute(query, [thePlayerID]);

        const collection = [];
        collection.push(0); // Add a single 0 as the first item in the collection

        rows.forEach(row => {
            const cardArray = [
                row.card_SET, row.image_URL, row.card_Name, row.flavor_TEXT, 
                row.card_Cost, row.card_Color, row.card_Attack, row.card_Defense, 
                row.rarity, row.card_Ability1, row.card_Ability2, row.card_ID
            ];
            collection.push(cardArray);
        });

        console.log('Collection updated successfully:', collection);
        res.json({ collection });
    } catch (error) {
        console.error('Error updating collection:', error);
        res.status(500).json({ error: 'Error updating collection', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/makeStarterDeck', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { playerID } = req.body;
    console.log('Creating starter deck for player ID:', playerID);

    if (!playerID) {
        return res.status(400).json({ error: 'playerID is required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        // Step 1: Check the database for all rows with the given user_ID
        const query1 = 'SELECT card_ID FROM card_info WHERE user_ID = ?';
        const [rows] = await connection.execute(query1, [playerID]);

        if (rows.length !== 60) {
            return res.status(400).json({ error: 'There should be exactly 60 cards for the given user_ID' });
        }

        // Step 2: Take the unique value of card_ID for all 60 rows
        const cardIDs = rows.map(row => row.card_ID);

        // Step 2.5: Create a unique deck_ID
        const newDeckID = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
        // Step 3: Add a new row to the table deck_list
        const columns = ['deck_ID', 'deck_Name', 'user_ID', ...Array.from({ length: 60 }, (_, i) => `cardSlot${String(i + 1).padStart(2, '0')}`)];
        const values = [newDeckID, 'Starter Deck', playerID, ...cardIDs];
        const placeholders = columns.map(() => '?').join(', ');

        const query2 = `INSERT INTO deck_list (${columns.join(', ')}) VALUES (${placeholders})`;
        console.log('Executing query:', query2, values);
        const [result] = await connection.execute(query2, values);

        console.log('Starter deck created successfully:', result);
        res.json({ message: 'Starter deck created successfully', result });
    } catch (error) {
        console.error('Error creating starter deck:', error);
        res.status(500).json({ error: 'Error creating starter deck', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/updateDecks', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { thePlayerID } = req.body;
    console.log('Updating decks for player ID:', thePlayerID);

    if (!thePlayerID) {
        return res.status(400).json({ error: 'thePlayerID is required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        // Retrieve all decks for the given player ID
        const query1 = 'SELECT * FROM deck_list WHERE user_ID = ?';
        const [decks] = await connection.execute(query1, [thePlayerID]);

        // Retrieve all cards for each deck
        const deckData = await Promise.all(decks.map(async deck => {
            const deckName = deck.deck_Name;
            const cardSlots = Array.from({ length: 60 }, (_, i) => `cardSlot${String(i + 1).padStart(2, '0')}`);
            const cardIDs = cardSlots.map(slot => deck[slot]).filter(id => id !== null);

            if (cardIDs.length === 0) {
                return { deck_Name: deckName, cards: [] };
            }

            const query2 = `SELECT * FROM card_info WHERE card_ID IN (${cardIDs.map(() => '?').join(', ')})`;
            const [cards] = await connection.execute(query2, cardIDs);

            return { deck_Name: deckName, cards };
        }));

        console.log('Decks updated successfully:', deckData);
        res.json({ decks: deckData });
    } catch (error) {
        console.error('Error updating decks:', error);
        res.status(500).json({ error: 'Error updating decks', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/saveDeck', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { deck, thePlayerID } = req.body;
    const deckName = deck[0];
    let cardIDs = deck.slice(1).map(card => card[11]); // Extract the twelfth item (card_ID) from each card array

    if (!deckName || !thePlayerID) {
        return res.status(400).json({ error: 'deckName and thePlayerID are required' });
    }

    // Ensure cardIDs array has exactly 60 items, filling with empty strings if necessary
    while (cardIDs.length < 60) {
        cardIDs.push('');
    }

    // Log the contents of cardIDs to debug the issue
    console.log('cardIDs:', cardIDs);

    // Ensure all cardIDs are strings
    cardIDs = cardIDs.map(cardID => String(cardID));

    // Log the lengths of card IDs to debug the issue
    cardIDs.forEach((cardID, index) => {
        console.log(`Length of cardSlot${String(index + 1).padStart(2, '0')}: ${cardID.length}`);
    });

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        // Check if a deck with the same deck_Name already exists
        const query1 = 'SELECT deck_ID FROM deck_list WHERE user_ID = ? AND deck_Name = ?';
        const [rows] = await connection.execute(query1, [thePlayerID, deckName]);

        if (rows.length > 0) {
            // Update the existing deck
            const existingDeckID = rows[0].deck_ID;
            const columns = Array.from({ length: 60 }, (_, i) => `cardSlot${String(i + 1).padStart(2, '0')}`);
            const setClause = columns.map(col => `${col} = ?`).join(', ');
            const query2 = `UPDATE deck_list SET ${setClause} WHERE deck_ID = ?`;
            const values = [...cardIDs, existingDeckID];
            console.log('Executing query:', query2, values);
            await connection.execute(query2, values);
            console.log('Deck updated successfully');
        } else {
            // Insert a new deck
            let newDeckID;
            let isUnique = false;
            do {
                newDeckID = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
                const queryCheck = 'SELECT COUNT(*) AS count FROM deck_list WHERE deck_ID = ?';
                const [checkRows] = await connection.execute(queryCheck, [newDeckID]);
                isUnique = checkRows[0].count === 0;
            } while (!isUnique);

            const columns = ['deck_ID', 'deck_Name', 'user_ID', ...Array.from({ length: 60 }, (_, i) => `cardSlot${String(i + 1).padStart(2, '0')}`)];
            const placeholders = columns.map(() => '?').join(', ');
            const query3 = `INSERT INTO deck_list (${columns.join(', ')}) VALUES (${placeholders})`;
            const values = [newDeckID, deckName, thePlayerID, ...cardIDs];
            console.log('Executing query:', query3, values);
            await connection.execute(query3, values);
            console.log('Deck added successfully');
        }

        res.json({ message: 'Deck saved successfully' });
    } catch (error) {
        console.error('Error saving deck:', error);
        res.status(500).json({ error: 'Error saving deck', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/updateFavCard', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { thePlayerID, cardID } = req.body;
    console.log('Updating favorite card for player ID:', thePlayerID, 'to card ID:', cardID);

    if (!thePlayerID || !cardID) {
        return res.status(400).json({ error: 'thePlayerID and cardID are required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        // Check if a user with the given user_ID exists
        const query1 = 'SELECT userID FROM user_info WHERE userID = ?';
        const [rows] = await connection.execute(query1, [thePlayerID]);

        if (rows.length > 0) {
            // Update the favCard_ID for the user
            const query2 = 'UPDATE user_info SET favCard_ID = ? WHERE userID = ?';
            const values = [cardID, thePlayerID];
            console.log('Executing query:', query2, values);
            await connection.execute(query2, values);
            console.log('Favorite card updated successfully');
            res.json({ message: 'Favorite card updated successfully' });
        } else {
            console.log('User not found');
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating favorite card:', error);
        res.status(500).json({ error: 'Error updating favorite card', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/returnFavCard', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { thePlayerID } = req.body;
    console.log('Returning favorite card for player ID:', thePlayerID);

    if (!thePlayerID) {
        return res.status(400).json({ error: 'thePlayerID is required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        // Step 1: Check in user_info for the given thePlayerID under userID
        const query1 = 'SELECT favCard_ID FROM user_info WHERE userID = ?';
        const [userRows] = await connection.execute(query1, [thePlayerID]);

        // --- CHANGED: Always return { favoriteCard: null } if not found or not set ---
        if (userRows.length === 0) {
            console.log('User not found');
            return res.json({ favoriteCard: null });
        }

        const favCardID = userRows[0].favCard_ID;
        if (!favCardID) {
            console.log('Favorite card not set');
            return res.json({ favoriteCard: null });
        }

        // Step 2: Find a matching card_ID to the favCard_ID in the table card_info
        const query2 = 'SELECT * FROM card_info WHERE card_ID = ?';
        const [cardRows] = await connection.execute(query2, [favCardID]);

        if (cardRows.length === 0) {
            console.log('Favorite card not found in card_info');
            return res.json({ favoriteCard: null });
        }

        const cardData = cardRows[0];
        const { card_ID, user_ID, ...rest } = cardData;
        const resultArray = [...Object.values(rest), card_ID];

        console.log('Favorite card data:', resultArray);
        // --- CHANGED: Always return as { favoriteCard: ... } for consistency ---
        res.json({ favoriteCard: resultArray });
    } catch (error) {
        console.error('Error returning favorite card:', error);
        res.status(500).json({ error: 'Error returning favorite card', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/deleteFavCard', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { thePlayerID } = req.body;
    console.log('Deleting favorite card for player ID:', thePlayerID);

    if (!thePlayerID) {
        return res.status(400).json({ error: 'thePlayerID is required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        // Check if a user with the given user_ID exists
        const query1 = 'SELECT userID FROM user_info WHERE userID = ?';
        const [rows] = await connection.execute(query1, [thePlayerID]);

        if (rows.length > 0) {
            // Update the favCard_ID to null for the user
            const query2 = 'UPDATE user_info SET favCard_ID = NULL WHERE userID = ?';
            console.log('Executing query:', query2, [thePlayerID]);
            await connection.execute(query2, [thePlayerID]);
            console.log('Favorite card deleted successfully');
            res.json({ message: 'Favorite card deleted successfully' });
        } else {
            console.log('User not found');
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error deleting favorite card:', error);
        res.status(500).json({ error: 'Error deleting favorite card', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// Needs to be edited as new packages are added
// Not using?????
app.post('/fillSealedPacks', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { thePlayerID } = req.body;
    console.log('Filling sealedPacks array for player ID:', thePlayerID);

    if (!thePlayerID) {
        return res.status(400).json({ error: 'thePlayerID is required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        // Query to get the pack counts for frog, horse, and rhino
        const query = `
            SELECT frog_PacksCT, horse_PacksCT, rhino_PacksCT
            FROM user_info
            WHERE userID = ?
        `;
        const [rows] = await connection.execute(query, [thePlayerID]);

        if (rows.length > 0) {
            const { frog_PacksCT, horse_PacksCT, rhino_PacksCT } = rows[0];
            const sealedPacks = [];

            // Add the values to the array in the specified order, excluding null or undefined values
            if (frog_PacksCT != null) sealedPacks.push(frog_PacksCT);
            if (horse_PacksCT != null) sealedPacks.push(horse_PacksCT);
            if (rhino_PacksCT != null) sealedPacks.push(rhino_PacksCT);

            console.log('Sealed Packs:', sealedPacks);
            res.json({ sealedPacks });
        } else {
            console.log('User not found');
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error filling sealed packs:', error);
        res.status(500).json({ error: 'Error filling sealed packs', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/buyPack', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { packType, cost, thePlayerID } = req.body;
    console.log('Buying pack for player ID:', thePlayerID, 'Pack type:', packType, 'Cost:', cost);

    if (!packType || !cost || !thePlayerID) {
        return res.status(400).json({ error: 'packType, cost, and thePlayerID are required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        const columnToUpdate = `${packType}_PacksCT`;

        // Step 1: Check if the column exists in the user_info table
        const columnCheckQuery = `
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'user_info' AND COLUMN_NAME = ?
        `;
        const [columnCheckRows] = await connection.execute(columnCheckQuery, [columnToUpdate]);

        if (columnCheckRows.length === 0) {
            return res.status(400).json({ error: `Column ${columnToUpdate} does not exist` });
        }

        // Step 2: Add one to the column that matches the incoming string plus '_PacksCT'
        // Step 3: Subtract the incoming variable 'cost' from the value of userCoins in that same row
        const updateQuery = `
            UPDATE user_info
            SET ${columnToUpdate} = ${columnToUpdate} + 1, userCoins = userCoins - ?
            WHERE userID = ?
        `;
        await connection.execute(updateQuery, [cost, thePlayerID]);

        // Step 4: Update sealedPacks array and get the updated userCoins
        const sealedPacksQuery = `
            SELECT frog_PacksCT, horse_PacksCT, rhino_PacksCT, wild_PacksCT, userCoins
            FROM user_info
            WHERE userID = ?
        `;
        const [sealedPacksRows] = await connection.execute(sealedPacksQuery, [thePlayerID]);
        const sealedPacks = [
            sealedPacksRows[0].frog_PacksCT,
            sealedPacksRows[0].horse_PacksCT,
            sealedPacksRows[0].rhino_PacksCT,
            sealedPacksRows[0].wild_PacksCT
        ];
        const userCoins = sealedPacksRows[0].userCoins;

        console.log('Updated Sealed Packs:', sealedPacks);
        console.log('Updated Coins:', userCoins);
        res.json({ sealedPacks, userCoins });
    } catch (error) {
        console.error('Error buying pack:', error);
        res.status(500).json({ error: 'Error buying pack', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/updatePacksAndCoins', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { thePlayerID } = req.body;
    console.log('Updating packs and coins for player ID:', thePlayerID);

    if (!thePlayerID) {
        return res.status(400).json({ error: 'thePlayerID is required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        // Query to get the pack counts and userCoins for the given playerID
        const query = `
            SELECT frog_PacksCT, horse_PacksCT, rhino_PacksCT, wild_PacksCT, userCoins
            FROM user_info
            WHERE userID = ?
        `;
        const [rows] = await connection.execute(query, [thePlayerID]);

        if (rows.length > 0) {
            const userInfo = rows[0];
            const unopenedPacks = [
                userInfo.frog_PacksCT,
                userInfo.horse_PacksCT,
                userInfo.rhino_PacksCT,
                userInfo.wild_PacksCT
            ];
            const userCoins = userInfo.userCoins;

            console.log('Updated Unopened Packs:', unopenedPacks);
            console.log('Updated Coins:', userCoins);
            res.json({ frog_PacksCT: userInfo.frog_PacksCT, horse_PacksCT: userInfo.horse_PacksCT, rhino_PacksCT: userInfo.rhino_PacksCT, wild_PacksCT: userInfo.wild_PacksCT, userCoins });
        } else {
            console.log('User not found');
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating packs and coins:', error);
        res.status(500).json({ error: 'Error updating packs and coins', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/openPack', async (req, res) => {
    console.log('Received request body:', req.body); // Log the request body
    const { packType, thePlayerID } = req.body;
    console.log('Opening pack for player ID:', thePlayerID, 'Pack type:', packType);

    if (!packType || !thePlayerID) {
        return res.status(400).json({ error: 'packType and thePlayerID are required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        console.log('Connection established.');

        const columnToUpdate = `${packType}_PacksCT`;

        // Step 1: Check if the column exists in the user_info table
        const columnCheckQuery = `
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'user_info' AND COLUMN_NAME = ?
        `;
        const [columnCheckRows] = await connection.execute(columnCheckQuery, [columnToUpdate]);

        if (columnCheckRows.length === 0) {
            return res.status(400).json({ error: `Column ${columnToUpdate} does not exist` });
        }

        // Step 2: Subtract one from the column that matches the incoming string plus '_PacksCT'
        const updateQuery = `
            UPDATE user_info
            SET ${columnToUpdate} = ${columnToUpdate} - 1
            WHERE userID = ?
        `;
        await connection.execute(updateQuery, [thePlayerID]);

        // Step 3: Update sealedPacks array
        const sealedPacksQuery = `
            SELECT frog_PacksCT, horse_PacksCT, rhino_PacksCT, wild_PacksCT
            FROM user_info
            WHERE userID = ?
        `;
        const [sealedPacksRows] = await connection.execute(sealedPacksQuery, [thePlayerID]);
        const sealedPacks = [
            sealedPacksRows[0].frog_PacksCT,
            sealedPacksRows[0].horse_PacksCT,
            sealedPacksRows[0].rhino_PacksCT,
            sealedPacksRows[0].wild_PacksCT
        ];

        console.log('Updated Sealed Packs:', sealedPacks);
        res.json({ sealedPacks });
    } catch (error) {
        console.error('Error opening pack:', error);
        res.status(500).json({ error: 'Error opening pack', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/getDecks', async (req, res) => {
    const { playerID } = req.body;
    if (!playerID) {
        return res.status(400).json({ error: 'playerID is required' });
    }

    let connection;
    try {
        connection = await initializeConnection();
        const query = 'SELECT * FROM deck_list WHERE user_ID = ?';
        const [decks] = await connection.execute(query, [playerID]);
        res.json(decks);
    } catch (error) {
        console.error('Error fetching decks:', error);
        res.status(500).json({ error: 'Error fetching decks', details: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/confirmSell', async (req, res) => {
    const { playerID, cardIDs, sellValue } = req.body;
    if (!playerID || !Array.isArray(cardIDs) || cardIDs.length === 0 || typeof sellValue !== 'number') {
        return res.status(400).json({ success: false, error: 'Invalid input' });
    }

    let connection;
    try {
        connection = await initializeConnection();

        // Delete cards from card_info
        const deleteQuery = `DELETE FROM card_info WHERE card_ID IN (${cardIDs.map(() => '?').join(',')})`;
        await connection.execute(deleteQuery, cardIDs);

        // Update user's coins
        const updateQuery = `UPDATE user_info SET userCoins = userCoins + ? WHERE userID = ?`;
        await connection.execute(updateQuery, [sellValue, playerID]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error in confirmSell:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
