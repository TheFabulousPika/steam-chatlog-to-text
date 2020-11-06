// 0.1 - First attempt
// 0.2 - Complete code overhaul
// 0.3 - Additional message parsing/formatting for YouTube videos
// 0.4 - CSS formatting for output html. Fixed timestamp appendment for message blocks consisting of multiple and consecutive /me commands
// 0.5 - Support for multiple chat tabs. Converts chat history for active tab.
// 0.6 - chatBody tag name update on Steam's end ("DropTarget chatBody" to "DropTarget chatWindow MultiUserChat"). Added feature to remove yesterday / day of week from timestamp.

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Primary Functions
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// reformat()							----- mother of all functions
// findActiveTabIndex()						----- finds the index number of the chatHistory node for the active tab
// msgtimeDivision(a)						----- function used to process 'msg timeDivision' (date & time) node
// msgtimeDivisiontime_passes(a)					----- function used to process 'msg timeDivision time_passes' (horizontal line indicating passage of time) node
// ChatMessageBlock(a)						----- function used to process 'ChatMessageBlock' (a chatblock with a mutiple messages from speaker) node.
// ChatMessageBlockSingletonMsg(a)				----- function used to process 'ChatMessageBlock SingletonMsg' (a chatblock with a single message from speaker) node.
// ChatMessageBlockLastMessageBlock(a)				----- calls ChatMessageBlock() and returns output
// ChatMessageBlockLastMessageBlockHasInternalTimeStamp(a)	----- calls ChatMessageBlock() and returns output
// ChatMessageBlockLastMessageBlockSingletonMsg(a)		----- calls ChatMessageBlockSingletonMsg(a) and returns output
// disconnectBlocker(a)						----- dummy function to deal with empty node
// checkurl()							----- checks if URL is tab is https://steamcommunity.com/chat/
function reformat() {
	var activeTabIndex = findActiveTabIndex();
	var chatHistory = document.getElementsByClassName("chatHistory")[activeTabIndex].childNodes;
	var chatRoomName = findChatRoomName();
//Where the reformatted log will be stored
	var newLog = '';
	var styleCSS = '<style>body { font-family: monospace; color: #c1c6cf; background-color: #1d1f24} .speaker { color: #6dcff6} a { color: #57cbde} [class*=emoticon_large] { zoom : 0.35} .serverMsg {  color: #aaffaa ; font-style: italic }</style>';
//	var styleCSS = '<style>body { font-family: monospace; color: black; background-color: white} .speaker { color: black}</style>';
	var htmlHeader = '<title>' + chatRoomName + '</title>' + styleCSS;
	for (var i = 0; i < chatHistory.length-1; i++){
		var thisChatBlock = chatHistory[i];
//Use the className of the chatblock to execute corresponding function in this script.
//e.g.
//If the block is a "msg timeDivision" time divider, msgtimeDivision() will be executed.
//If the block is a "ChatMessageBlock SingletonMsg", ChatMessageBlockSingletonMsg() will be executed.
//and so forth.
//Function names are deliberately based on the possible classNames of each block, with spaces removed.
		var useThisFunction = thisChatBlock.className.replace(/\s/g,'');
		var newLine = window[useThisFunction](thisChatBlock);
		newLog = newLog + newLine;
	}
	var newWindow = window.open();
	newWindow.document.head.innerHTML = htmlHeader;
	newWindow.document.body.innerHTML = newLog;
	newWindow.scrollTo(0,newWindow.document.body.scrollHeight);
}
function findChatRoomName() {
	var activeTabIndex = findActiveTabIndex();
	var activeChatBody = document.getElementsByClassName("DropTarget chatWindow MultiUserChat")[activeTabIndex];
	if (activeChatBody.getElementsByClassName("FriendChatTypingNotification").length > 0){
		var friendName = activeChatBody.getElementsByClassName("FriendChatTypingNotification")[0].innerText.split(" is typing a message...")[0];
		return friendName;
	}
	else {
	return activeChatBody.getElementsByClassName("chatRoomGroupHeaderName")[0].innerHTML;
	}
}
function findActiveTabIndex() {
	var chatBodies = document.getElementsByClassName("DropTarget chatWindow MultiUserChat");
	var activeTabIndex = 0;
	for (var i = 0; i < chatBodies.length; i++){
//alt: use element.getAttribute(attributeName) for data-activechat="true". Couldn't get it to work but would be cleaner.
		var thischatBodyDisplay = chatBodies[i].style.display;
		if (thischatBodyDisplay!="none"){
		activeTabIndex = i;
		}
	}
	return activeTabIndex;
}
function msgtimeDivision(a){
	var timeDivision = a.innerText +  '<hr />';
	return timeDivision;
}
function msgtimeDivisiontime_passes(a){
	var lineDivision = '<hr />';
	return lineDivision;
}
function msgserverMsg(a){
	var serverMsg =  '<span class="serverMsg">' + a.innerText +  '</span><br />';
	return serverMsg;
}
function ChatMessageBlock(a){
	var thisBlockSpeaker = a.getElementsByClassName("speakerName")[0].innerText;
	var thisBlockMsg = a.getElementsByClassName("msgText");
	var firstMsg = thisBlockMsg[0];
	var thisBlockTime;
	if (checkIfMe(firstMsg)){
	thisBlockTime = cleanupTimeStamp(firstMsg.nextSibling.innerText);
	}
	else {
	thisBlockTime = cleanupTimeStamp(a.getElementsByClassName("speakerTimeStamp")[0].innerText);
	}
	var thisBlockMsgTime = new Array(thisBlockMsg.length);
	var thisBlockReturn = '';
	thisBlockMsgTime[0] = thisBlockTime;
		for (var j = 1; j < thisBlockMsg.length ; j++){
			var thisMsgTime;
//If the msg has an associated timestamp within the log, use that one
			if (thisBlockMsg[j].parentNode.childNodes.length > '2'){
				if (checkIfMe(thisBlockMsg[j])){
				thisMsgTime = thisBlockMsg[j].nextSibling.innerHTML;
				thisBlockMsgTime[j] = thisMsgTime;
				}
				else {
				thisMsgTime = thisBlockMsg[j].previousSibling.innerHTML;
				thisBlockMsgTime[j] = thisMsgTime;
				}
			}
			else {
//Subsequent msgs sent on the same timestamp from the same speaker will not have timestamps in the log, hence timestamp will be copied from the previous msg
				thisBlockMsgTime[j] = thisBlockMsgTime[j-1];
			}
		}
		for (var k = 0; k < thisBlockMsg.length ; k++){
		var thisMsg = cleanupMsg(thisBlockMsg[k]);
		thisBlockReturn = thisBlockReturn + thisBlockMsgTime[k] + ' - <span class="speaker">' + thisBlockSpeaker + ':</span> ' + thisMsg + '<br />';
		}
		return thisBlockReturn;
}
function ChatMessageBlockSingletonMsg(a){
	var thisChatBlock;
	if (checkIfVoiceChatMsg(a)){
	thisChatBlock = a.getElementsByClassName("msg voiceChannelInvite")[0].innerText + '<hr />';
	return thisChatBlock;
	}
	else {
	var msgText = a.getElementsByClassName("msgText")[0];
	var thisBlockSpeaker = a.getElementsByClassName("speakerName")[0].innerText;
	var msgTime;
		if (checkIfMe(msgText)){
		msgTime = cleanupTimeStamp(msgText.nextSibling.innerText);
		}
		else {
		msgTime = cleanupTimeStamp(a.getElementsByClassName("speakerTimeStamp")[0].innerText);
		}
	var cleanedMsgText = cleanupMsg(msgText);
	thisChatBlock = msgTime + ' - <span class="speaker">' + thisBlockSpeaker + ':</span> ' + cleanedMsgText + '<br />';
	return thisChatBlock;
	}
}
function ChatMessageBlockLastMessageBlock(a){
	return ChatMessageBlock(a);
}
function ChatMessageBlockLastMessageBlockHasInternalTimeStamp(a){
	return ChatMessageBlock(a);
}
function ChatMessageBlockLastMessageBlockSingletonMsg(a){
	return ChatMessageBlockSingletonMsg(a);
}
function disconnectBlocker(){
}
function checkurl() {
	if (window.location.href == 'https://steamcommunity.com/chat/') {
	reformat();
	}
	else {
	alert('Steam Chatlog2Text must be executed on \nhttps://steamcommunity.com/chat/');
	}
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Message Reformatting Functions
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// cleanupTimeStamp(String) 	----- Removes yesterday / day of week from timestamp
// cleanupMsg(MessageNode) 	----- Cleans up body of messages in case special formatting was used
//					/giphy ----- Extract giphy command and URL
//					/code and pre ----- Extract the body of the message and prefix commands before message
//					/me ----- prefix message with '/me'
//					Graph ----- Extracts URL
// linkefyURL(URL) 		----- creates HTML code linking to URL
// checkIfMe(MessageNode) 	----- check if MessageNode uses /me formatting. Returns TRUE or FALSE
// checkIfPre(MessageNode)	----- check if MessageNode uses /pre formatting. Returns TRUE or FALSE
// checkIfCode(MessageNode)	----- check if MessageNode uses /code formatting. Returns TRUE or FALSE
// checkIfGraph(MessageNode)	----- check if MessageNode is a graph (webpage previews generated from URLs). Returns TRUE or FALSE
// checkIfYouTube(MessageNode)	----- check if MessageNode is a YouTube object. Returns TRUE or FALSE
// checkIfImg(MessageNode)	----- check if MessageNode is an image object. Returns TRUE or FALSE

function cleanupTimeStamp(a){
//split timestamp string by spaces, take the last two pieces and join them with a space.
//"Yesterday, 11:11 PM" -> "11:11 PM"
//"Monday 11:11 PM" -> "11:11 PM"
//"11:11 PM" -> "11:11 PM"
//use pop()?
	var rawTimeStampPieces = a.split(" ");
	var l = rawTimeStampPieces.length;
	var cleanedTimeStamp;
	cleanedTimeStamp = rawTimeStampPieces[l-2] + " " + rawTimeStampPieces[l-1];
	return cleanedTimeStamp;
}
function cleanupMsg(a){
	var thisMsgNode = a;
	var cleanedMsgText = '';
//NonInlinedEmbed
	if (checkFormatting(thisMsgNode,"NonInlinedEmbed")){
	var dataCopyText = thisMsgNode.querySelectorAll('[class*=NonInlined]')[0].getAttributeNode("data-copytext").value;
	cleanedMsgText = dataCopyText;
	}
//giphy
	else if (checkIfGiphy(thisMsgNode)){
	var giphyCommand = thisMsgNode.firstChild.innerText;
	var giphyImageURL = thisMsgNode.lastChild.getElementsByClassName("chatImageURL")[0].href;
	cleanedMsgText = giphyCommand + '</br>' + linkefyURL(giphyImageURL);
	}
//pre
	else if (checkFormatting(thisMsgNode,"PreMessage")){
	var preText= thisMsgNode.querySelectorAll('[class*=PreMessage]')[0].innerHTML;
	cleanedMsgText = '/pre ' + preText;
	}
//code
	else if (checkFormatting(thisMsgNode,"CodeMessage")) {
	var codeText= thisMsgNode.querySelectorAll('[class*=CodeMessage]')[0].innerHTML;
	cleanedMsgText = '/code ' + codeText;
	}
//spoiler
	else if (checkIfSpoiler(thisMsgNode)) {
	var spoilerTextHTML = thisMsgNode.getElementsByClassName("spoilerMsg")[0].innerHTML;
	cleanedMsgText = '/spoiler ' + spoilerTextHTML;
	}
//quote
	else if (checkFormatting(thisMsgNode,"QuoteMessage")) {
	cleanedMsgText = '/quote ' + thisMsgNode.querySelectorAll('[class*=QuoteMessage]')[0].innerHTML;
	}
//graph
	else if (checkFormatting(thisMsgNode,"ChatMessageOpenGraph")) {
	var graphURL = thisMsgNode.getElementsByClassName("ChatMessageOpenGraph_Title")[0].href;
	var graphTitle = thisMsgNode.getElementsByClassName("ChatMessageOpenGraph_Title")[0].innerText;
	cleanedMsgText = linkefyURL(graphURL) + '<br />' + graphTitle;
	}
//me
	else if (checkIfMe(thisMsgNode)){
	cleanedMsgText = '/me ' + thisMsgNode.innerText;
	}
//YouTube
	else if (checkFormatting(thisMsgNode,"BBCodeYouTubeComponent")) {
	cleanedMsgText = dataCopyTextWithLink(thisMsgNode,"BBCodeYouTubeComponent");
	}
//Img
	else if (checkFormatting(thisMsgNode,"chatImageContainer")) {
		if (typeof thisMsgNode.getElementsByClassName("FailedToLoadImage")[0] === 'object'){
		cleanedMsgText = thisMsgNode.getElementsByClassName("FailedToLoadImage")[0].innerHTML;
		}
		else {
		var imgURL = thisMsgNode.getElementsByClassName("chatImageFull")[0].src;
		cleanedMsgText = '[attached image] ' + linkefyURL(imgURL);
		}
	}
	else if (checkIfVideo(thisMsgNode)){
	var videoURL = thisMsgNode.getElementsByClassName("chatImageURL")[0].href;
	cleanedMsgText = '[attached video] ' + linkefyURL(videoURL);
	}
//CollapsedObject
	else if (checkFormatting(thisMsgNode,"BBCodeAlreadyCollapsedText")) {
	cleanedMsgText = "[" + thisMsgNode.querySelectorAll('[class*=BBCodeAlreadyCollapsedText]')[0].innerHTML + "]";
	}
//Sticker
	else if (checkIfSticker(thisMsgNode)){
	var stickerURL = thisMsgNode.firstChild.children[1].src;
	cleanedMsgText = '<br /><img src="' + stickerURL + '" alt="' + stickerURL + '" />';
	}
//Trade
	else if (checkIfTradeInvite(thisMsgNode)){
	var tradeOfferText = thisMsgNode.getElementsByClassName("inviteLabel TradeOfferInvite_Title")[0].innerText;
	var tradeOfferURL = thisMsgNode.getElementsByClassName("inviteURLLink")[0].value;
	cleanedMsgText = tradeOfferText + '<br />' + linkefyURL(tradeOfferURL);
	}
//Tweet
	else if (checkIfTweet(thisMsgNode)){
	var tweetHeader = thisMsgNode.getElementsByClassName("bbcode_ChatMessageTweet_Header_gpcGy")[0].attributes[2].value;
	var tweetURL = thisMsgNode.getElementsByClassName("bbcode_ChatMessageTweet_Body_2mh_n")[0].attributes[2].value;
	var tweetFooter = thisMsgNode.getElementsByClassName("bbcode_ChatMessageTweet_Footer_11DrN")[0].innerText;
	cleanedMsgText = linkefyURL(tweetURL) + '<br />' + tweetHeader + ' ' + tweetFooter;
	}
//Random
	else if (checkIfRandom(thisMsgNode)){
	var randomHeader = '/random ';
	var randomValues = thisMsgNode.firstElementChild.firstElementChild.nextSibling.innerText;
	var actualValues = thisMsgNode.querySelectorAll('[class*=randomActual]');
	var rolledNumber = '';
		for (var i = 0; i < actualValues.length; i++){
		rolledNumber = rolledNumber + actualValues[i].innerText;
		}
	cleanedMsgText = randomHeader + randomValues + ': ' + rolledNumber;
	}
//Spoiler Media
	else if (checkIfSpoilerMedia(thisMsgNode)){
	var spoilerMediaHTML = thisMsgNode.getElementsByClassName("spoilerMsg")[0].innerHTML;
	cleanedMsgText = '/spoiler ' + spoilerMediaHTML;
	}
//flip
	else if (checkFormatting(thisMsgNode,"flipCoinAndResult")) {
	cleanedMsgText = '/flip: ' + thisMsgNode.querySelectorAll('[class*=resultLabel]')[0].innerHTML;
	}
//StoreLink
	else if (checkFormatting(thisMsgNode,"ChatMessageSteamStore")){
	var gameTitle = thisMsgNode.querySelectorAll('[class*=ChatMessageSteamStore_Name]')[0].innerHTML;
	var gamePublisher = thisMsgNode.querySelectorAll('[class*=ChatMessageSteamStore_GameNameAndIcon]')[0].nextSibling.innerHTML;
	var gameYear = thisMsgNode.querySelectorAll('[class*=ChatMessageSteamStore_GameNameAndIcon]')[0].nextSibling.nextSibling.innerHTML;
	var gameSummary = thisMsgNode.querySelectorAll('[class*=ChatMessageSteamStore_Description]')[0].innerHTML;
	var gamePrice = thisMsgNode.querySelectorAll('[class*=ChatMessageSteamStore_Pricing_Final]')[1].innerHTML;
	var gameURL = "https://store.steampowered.com/app/" + thisMsgNode.querySelectorAll('[class*=ChatMessageSteamStore_HeaderImage]')[0].src.split('/')[5];
	cleanedMsgText = gameTitle + ' / ' + gamePublisher + ' / ' + gameYear + ' / ' + gamePrice  + '<br />' + gameSummary  + '<br />' +  linkefyURL(gameURL);
	}
//catch-all for messages that aren't in above categories
	else {
	cleanedMsgText = thisMsgNode.innerHTML;
	}
	return cleanedMsgText;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Reformatting functions
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function linkefyURL(a){
	var url = a;
	var linkefiedURL = '<a href="' + url + '">' + url + '</a>';
	return linkefiedURL;
}
function dataCopyTextWithLink(a,b){
	var thisMsgNode = a;
	var dataCopyClassName = "'[class*=" + b + "]'";
	var dataCopyText = thisMsgNode.querySelectorAll(eval(dataCopyClassName))[0].getAttributeNode("data-copytext").value;
	var dataCopyArray = dataCopyText.split("\n");
	var dataCopyURL = dataCopyArray.pop();
	var dataCopyMainText = dataCopyArray.join("");
	var dataCopyTextWithLink = linkefyURL(dataCopyURL) + "<br />" + dataCopyMainText;
	return dataCopyTextWithLink;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// msgText type check functions
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function checkIfGiphy(a){
	var thisMsgNode = a;
	if (thisMsgNode.children.length < 2){
	return false;
	}
	else {
	var loopBoolean = false;
		for (var i = 0; (i < thisMsgNode.children.length) && (loopBoolean == false) ; i++){
		var childClass = thisMsgNode.children[i].className;
		var evalPatt = new RegExp("giphyImg");
		loopBoolean = evalPatt.test(childClass);
		}
	return loopBoolean;
	}
}
function checkIfSticker(a){
	var thisMsgNode = a;
	if (typeof thisMsgNode.firstChild.children[1] == "undefined"){
	return false;
	}
	if (typeof thisMsgNode.firstChild.children[1].src == "undefined"){
	return false;
	}
	else {
	var urlSrc = thisMsgNode.firstChild.children[1].src;
	var evalPatt = new RegExp("sticker");
	return evalPatt.test(urlSrc);
	}
}
function checkIfMe(a){
	var thisMsgNode = a;
	if (thisMsgNode.previousSibling == null){
	return false;
	}
	else if (thisMsgNode.previousSibling.className == 'speakerHoverArea'){
	return true;
	}
}
//Marked for deprecation
function checkIfPre(a){
	var thisMsgNode = a;
	var preOrNot= thisMsgNode.querySelectorAll('[class*=PreMessage]').length;
	if (preOrNot == 0){
	return false;
	}
	else {
	return true;
	}
}
//Marked for deprecation
function checkIfCode(a){
	var thisMsgNode = a;
	var codeOrNot= thisMsgNode.querySelectorAll('[class*=CodeMessage]').length;
	if (codeOrNot == 0){
	return false;
	}
	else {
	return true;
	}
}
//Marked for deprecation
function checkIfGraph(a){
	var thisMsgNode = a;
	if (thisMsgNode.children.length < 1){
	return false;
	}
	else {
	var childClass = thisMsgNode.children[0].className;
	var evalPatt = new RegExp("ChatMessageOpenGraph");
	return evalPatt.test(childClass);
	}
}
//Marked for deprecation
function checkIfYouTube(a){
	var thisMsgNode = a;
	if (thisMsgNode.children.length < 1){
	return false;
	}
	else {
	var childClass = thisMsgNode.children[0].className;
	var evalPatt = new RegExp("BBCodeYouTubeComponent");
	return evalPatt.test(childClass);
	}
}
//Marked for deprecation
function checkIfImg(a){
	var thisMsgNode = a;
	if (thisMsgNode.children.length < 1){
	return false;
	}
	else {
	var childClass = thisMsgNode.children[0].className;
	var evalPatt = new RegExp("chatImageContainer");
	return evalPatt.test(childClass);
	}
}
//0.6 Spoiler, Quote, Voicechat, Trade invite, attached video
function checkIfSpoiler(a){
	var thisMsgNode = a;
	if (thisMsgNode.children.length < 1 || thisMsgNode.children[0].attributes.length < 2){
	return false;
	}
	else {
	var childClass = thisMsgNode.children[0].className;
	var evalPatt1 = new RegExp("spoilerMsg");
	var secondAttr = thisMsgNode.children[0].attributes[1].value;
	var evalPatt2 = new RegExp("object");
	return (evalPatt1.test(childClass) && !(evalPatt2.test(secondAttr)));
	}
}
//Marked for deprecation
function checkIfQuote(a){
	var thisMsgNode = a;
	var quoteOrNot= thisMsgNode.querySelectorAll('[class*=QuoteMessage]').length;
	if (quoteOrNot == 0){
	return false;
	}
	else {
	return true;
	}
}
//Marked for deprecation
function checkIfFlip(a){
	var thisMsgNode = a;
	var flipOrNot= thisMsgNode.querySelectorAll('[class*=flipCoinAndResult]').length;
	if (flipOrNot == 0){
	return false;
	}
	else {
	return true;
	}
}
function checkIfVoiceChatMsg(a){
	var thisMsgBlock = a;
	if (thisMsgBlock.children[0].children[0].length < 1){
	return false;
	}
	else {
	var childClass = thisMsgBlock.children[0].children[0].className;
	var evalPatt = new RegExp("voiceChannelInvite");
	return evalPatt.test(childClass);
	}
}
function checkIfTradeInvite(a){
	var thisMsgNode = a;
	if (thisMsgNode.children.length < 1){
	return false;
	}
	else {
	var childClass = thisMsgNode.children[0].className;
	var evalPatt = new RegExp("TradeOfferInvite");
	return evalPatt.test(childClass);
	}
}
function checkIfVideo(a){
	var thisMsgNode = a;
	if (thisMsgNode.children.length < 1){
	return false;
	}
	else {
	var childClass = thisMsgNode.children[0].className;
	var evalPatt = new RegExp("chatVideoContainer");
	return evalPatt.test(childClass);
	}
}
function checkIfTweet(a){
	var thisMsgNode = a;
	if (thisMsgNode.children.length < 1){
	return false;
	}
	else {
	var childClass = thisMsgNode.children[0].className;
	var evalPatt = new RegExp("ChatMessageTweet");
	return evalPatt.test(childClass);
	}
}
function checkIfRandom(a){
	var thisMsgNode = a;
	if (thisMsgNode.children.length < 1){
	return false;
	}
	else {
	var childClass = thisMsgNode.children[0].className;
	var evalPatt = new RegExp("randomMsg");
	return evalPatt.test(childClass);
	}
}
//Marked for deprecation
function checkIfStoreLink(a){
	var thisMsgNode = a;
	var storeOrNot= thisMsgNode.querySelectorAll('[class*=ChatMessageSteamStore]').length;
	if (storeOrNot == 0){
	return false;
	}
	else {
	return true;
	}
}
function checkIfSpoilerMedia(a){
	var thisMsgNode = a;
	if (thisMsgNode.children.length < 1 || thisMsgNode.children[0].attributes.length < 2){
	return false;
	}
	else {
	var childClass = thisMsgNode.children[0].className;
	var evalPatt1 = new RegExp("spoilerMsg");
	var secondAttr = thisMsgNode.children[0].attributes[1].value;
	var evalPatt2 = new RegExp("object");
	return (evalPatt1.test(childClass) && evalPatt2.test(secondAttr));
	}
}
function checkFormatting(a,b){
	var thisMsgNode = a;
	var checkClassName = "'[class*=" + b + "]'";
	var testResult = thisMsgNode.querySelectorAll(eval(checkClassName)).length;
	if (testResult == 0){
	return false;
	}
	else {
	return true;
	}
}
//////////////////////////////////////////////////////////////////////////
// Code that is executed
//////////////////////////////////////////////////////////////////////////
checkurl();
