const { IgApiClient } = require('instagram-private-api');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();

const ig = new IgApiClient();
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const USERNAME = process.env.IG_USERNAME;
const PASSWORD = process.env.IG_PASSWORD;
const MOTS_CLES_COMMENTAIRES = config.motsClesCommentaires;
const MOTS_CLES_DMS = config.motsClesDM;

const historiquePath = 'historique.json';
let historique = { commentaires: [], dms: [] };

if (fs.existsSync(historiquePath)) {
    historique = JSON.parse(fs.readFileSync(historiquePath, 'utf8'));
    console.log('✅ Historique chargé.');
}

const commentairesTraites = new Set(historique.commentaires);
const dmsTraites = new Set(historique.dms);

function sauvegarderHistorique() {
    fs.writeFileSync(historiquePath, JSON.stringify(historique, null, 2));
}

async function login() {
    ig.state.generateDevice(USERNAME);

    if (fs.existsSync('session.json')) {
        const savedSession = JSON.parse(fs.readFileSync('session.json', 'utf8'));
        await ig.state.deserialize(savedSession);
        console.log('✅ Session restaurée depuis session.json');
    } else {
        try {
            await ig.account.login(USERNAME, PASSWORD);
            console.log('✅ Connecté à Instagram (sans 2FA)');
        } catch (error) {
            if (error.name === 'IgLoginTwoFactorRequiredError') {
                const { username, two_factor_identifier } = error.response.body.two_factor_info;
                const verificationCode = await askUserInput('👉 Entrez le code 2FA reçu : ');

                await ig.account.twoFactorLogin({
                    username,
                    verificationCode,
                    twoFactorIdentifier: two_factor_identifier,
                    verificationMethod: '1',
                    trustThisDevice: '1'
                });

                console.log('✅ Connecté à Instagram avec 2FA');
            } else {
                throw error;
            }
        }

        const sessionData = await ig.state.serialize();
        delete sessionData.constants;
        fs.writeFileSync('session.json', JSON.stringify(sessionData));
        console.log('💾 Session sauvegardée dans session.json');
    }
}

function askUserInput(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(question, answer => {
        rl.close();
        resolve(answer.trim());
    }));
}

function sleepRandom(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

function normaliserTexte(texte) {
    return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

async function surveillerCommentairesEtRepondre() {
    console.log('🕵️ Surveillance des commentaires activée...');
    const user = await ig.account.currentUser();
    const SELF_USER_ID = user.pk;
    const userFeed = ig.feed.user(user.pk);

    while (true) {
        const posts = await userFeed.items();

        for (const post of posts) {
            if (!post?.comments_disabled) {
                const commentsFeed = ig.feed.mediaComments(post.id);

                do {
                    const page = await commentsFeed.items();

                    for (const comment of page) {
                        if (commentairesTraites.has(comment.pk)) continue;
                        if (comment.user_id === SELF_USER_ID) continue;

                        const texteNormalise = normaliserTexte(comment.text);

                        for (const [motCle, reponse] of Object.entries(MOTS_CLES_COMMENTAIRES)) {
                            if (texteNormalise.includes(normaliserTexte(motCle))) {
                                console.log(`💬 Commentaire de ${comment.user.username} détecté : ${comment.text} (mot-clé : ${motCle})`);

                                await ig.media.comment({
                                    mediaId: post.id,
                                    text: reponse,
                                    replyToCommentId: comment.pk,
                                });

                                console.log(`💬 Réponse publique postée à ${comment.user.username} : "${reponse}"`);

                                commentairesTraites.add(comment.pk);
                                historique.commentaires.push(comment.pk);
                                sauvegarderHistorique();

                                await sleepRandom(15000, 20000);
                                break;
                            }
                        }
                    }
                } while (commentsFeed.isMoreAvailable());
            }
        }

        await sleepRandom(8000, 15000);
    }
}

async function surveillerDMsEtRepondre() {
    console.log('🕵️ Surveillance des DMs activée...');
    const user = await ig.account.currentUser();
    const SELF_USER_ID = user.pk;

    while (true) {
        const inboxFeed = ig.feed.directInbox();
        const inboxItems = await inboxFeed.items();

        for (const thread of inboxItems) {
            const lastMessage = thread.items[0];
            if (!lastMessage || dmsTraites.has(lastMessage.item_id)) continue;
            if (lastMessage.user_id === SELF_USER_ID) continue;

            const senderId = lastMessage.user_id;
            const userInfo = await ig.user.info(senderId);
            const senderUsername = userInfo.username;
            const messageText = normaliserTexte(lastMessage.text || '');

            for (const [motCle, reponse] of Object.entries(MOTS_CLES_DMS)) {
                if (messageText.includes(normaliserTexte(motCle))) {
                    console.log(`📩 DM reçu de ${senderUsername} contenant : "${motCle}"`);

                    await ig.entity.directThread([senderId.toString()]).broadcastText(reponse);

                    console.log(`📤 Réponse automatique envoyée à ${senderUsername} : "${reponse}"`);

                    dmsTraites.add(lastMessage.item_id);
                    historique.dms.push(lastMessage.item_id);
                    sauvegarderHistorique();

                    await sleepRandom(15000, 20000);
                    break;
                }
            }
        }

        await sleepRandom(6000, 10000);
    }
}

async function surveillerRequestsEtRepondre() {
    console.log('🕵️ Surveillance des requests activée...');
    const user = await ig.account.currentUser();
    const SELF_USER_ID = user.pk;

    while (true) {
        const requestsFeed = ig.feed.directPending();
        const requests = await requestsFeed.items();

        for (const thread of requests) {
            const lastMessage = thread.items[0];
            if (!lastMessage || dmsTraites.has(lastMessage.item_id)) continue;
            if (lastMessage.user_id === SELF_USER_ID) continue;

            const senderId = lastMessage.user_id;
            const userInfo = await ig.user.info(senderId);
            const senderUsername = userInfo.username;
            const messageText = normaliserTexte(lastMessage.text || '');

            for (const [motCle, reponse] of Object.entries(MOTS_CLES_DMS)) {
                if (messageText.includes(normaliserTexte(motCle))) {
                    console.log(`📨 Request reçue de ${senderUsername} contenant : "${motCle}"`);

                    await ig.directThread.approve(thread.thread_id);
                    console.log(`✅ Request de ${senderUsername} acceptée.`);

                    await ig.entity.directThread([senderId.toString()]).broadcastText(reponse);

                    console.log(`📤 Réponse automatique envoyée à ${senderUsername} : "${reponse}"`);

                    dmsTraites.add(lastMessage.item_id);
                    historique.dms.push(lastMessage.item_id);
                    sauvegarderHistorique();

                    await sleepRandom(15000, 20000);
                    break;
                }
            }
        }

        await sleepRandom(8000, 15000);
    }
}

(async () => {
    await login();
    await Promise.all([
        surveillerCommentairesEtRepondre(),
        surveillerDMsEtRepondre(),
        surveillerRequestsEtRepondre()
    ]);
})();
