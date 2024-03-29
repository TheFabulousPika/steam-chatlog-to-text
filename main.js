// 0.1 - First attempt
// 0.2 - Complete code overhaul
// 0.3 - Additional message parsing/formatting for YouTube videos
// 0.4 - CSS formatting for output html. Fixed timestamp appendment for message blocks consisting of multiple and consecutive /me commands
// 0.5 - Support for multiple chat tabs. Converts chat history for active tab.
// 0.6 - chatBody tag name update on Steam's end ("DropTarget chatBody" to "DropTarget chatWindow MultiUserChat"). Added feature to remove yesterday / day of week from timestamp.
// 0.7 - Up to GitHub Issue #49

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
// msgserverMsg(a)						----- server messages in group chat, (user joined, left, etc)
// msgtimeDivisionnew_messages(a)				----- server message (new messages since [timestamp])
// checkurl()							----- checks if URL is tab is https://steamcommunity.com/chat/
function reformat() {
	var activeTabIndex = findActiveTabIndex();
	var activeChatBody = document.getElementsByClassName("DropTarget chatWindow MultiUserChat")[activeTabIndex];
	var chatHistory = activeChatBody.getElementsByClassName("chatHistory")[0].childNodes;
	var chatRoomName = findChatRoomName();
//Where the reformatted log will be stored
	var newLog = '';
	var styleCSS = '<style>body { font-family: monospace; color: #c1c6cf; background-color: #1d1f24} .speaker { color: #6dcff6} a { color: #57cbde} [class*=emoticon_large] { zoom : 0.35} .stickerImg { zoom : 0.5} .serverMsg {  color: #aaffaa ; font-style: italic}</style>';
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
function msgtimeDivisionnew_messages(a){
	var msgtimeDivision = a.getAttributeNode("data-copytext").value + '<hr />';
	return msgtimeDivision;
}
function msgserverMsg(a){
	var serverMsg =  '<span class="serverMsg">' + a.innerText +  '</span><br />';
	return serverMsg;
}
function ChatMessageBlock(a){
	var thisBlock = a;
	var thisBlockSpeaker = thisBlock.getElementsByClassName("speakerName")[0].innerText;
	var thisBlockTime = cleanupTimeStamp(thisBlock.getElementsByClassName("speakerTimeStamp")[0].innerText);
	var thisBlockMsg = thisBlock.getElementsByClassName("msgText");
	var firstMsg = thisBlockMsg[0];
	var thisBlockMsgTime = new Array(thisBlockMsg.length);
	var thisBlockReturn = '';
	thisBlockMsgTime[0] = thisBlockTime;
		for (var j = 1; j < thisBlockMsg.length ; j++){
			var thisMsgTime;
//If the msg has an associated timestamp within the log, use that one
			if (checkIfMe(thisBlockMsg[j])){
				thisMsgTime = thisBlockMsg[j].parentNode.getElementsByClassName("speakerTimeStamp")[0].innerText;
				thisBlockMsgTime[j] = thisMsgTime;
			}
			else if (thisBlockMsg[j].parentNode.getElementsByClassName("FriendChatTimeStamp").length > 0) {
				thisMsgTime = thisBlockMsg[j].parentNode.getElementsByClassName("FriendChatTimeStamp")[0].innerText;
				thisBlockMsgTime[j] = thisMsgTime;
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
	if (checkFormatting(a,"voiceChannelInvite")){
	thisChatBlock = a.getElementsByClassName("msg voiceChannelInvite")[0].innerText + '<hr />';
	return thisChatBlock;
	}
	else {
	var msgText = a.getElementsByClassName("msgText")[0];
	var thisBlockSpeaker = a.getElementsByClassName("speakerName")[0].innerText;
	var msgTime;
		if (checkIfMe(msgText)){
		msgTime = cleanupTimeStamp(msgText.parentNode.getElementsByClassName("speakerTimeStamp")[0].innerText);
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
	thisMsgNode = addAltTextToEmoticons(thisMsgNode);
//NonInlinedEmbed
	if (checkFormatting(thisMsgNode,"NonInlinedEmbed")){
	var dataCopyText = thisMsgNode.querySelectorAll('[class*=NonInlined]')[0].getAttributeNode("data-copytext").value;
	cleanedMsgText = dataCopyText;
	}
//giphy
	else if (checkFormatting(thisMsgNode,"giphyImg")) {
	var giphyCommand = thisMsgNode.firstChild.innerText;
	var giphyImageURL = thisMsgNode.lastChild.getElementsByClassName("chatImageURL")[0].href;
	cleanedMsgText = giphyCommand + '</br>' + linkefyURL(giphyImageURL);
	}
//pre
	else if (checkFormatting(thisMsgNode,"PreMessage")){
//	var preText= thisMsgNode.querySelectorAll('[class*=PreMessage]')[0].innerHTML;
//	cleanedMsgText = '/pre ' + preText;
	cleanedMsgText = '/pre ' + grabFirstInnerHTMLQueryClass(thisMsgNode,"PreMessage");
	}
//code
	else if (checkFormatting(thisMsgNode,"CodeMessage")) {
//	var codeText= thisMsgNode.querySelectorAll('[class*=CodeMessage]')[0].innerHTML;
	cleanedMsgText = '/code ' + grabFirstInnerHTMLQueryClass(thisMsgNode,"CodeMessage");
	}
//spoiler
	else if (checkIfSpoiler(thisMsgNode)) {
	cleanedMsgText = '/spoiler ' + grabFirstInnerHTMLByClass(thisMsgNode,"spoilerMsg");
	}
//quote
	else if (checkFormatting(thisMsgNode,"QuoteMessage")) {
	cleanedMsgText = '/quote ' + grabFirstInnerHTMLQueryClass(thisMsgNode,"QuoteMessage");
	}
//SteamPublishedFile
	else if (checkFormatting(thisMsgNode,"SteamPublishedFile")) {
	var graphURL = "";
	if (thisMsgNode.getElementsByClassName("ChatLargeImageContainer").length > 0 ){
	graphURL = thisMsgNode.getElementsByClassName("ChatLargeImageContainer")[0].href;
	}
//	var graphTitle = "<h1 style='color: red'>SteamPublishedFile NO TITLE</h1>";
	var graphTitle = "";
	if (thisMsgNode.getElementsByClassName("ChatMessageOpenGraph_Description").length > 0 ){
	graphTitle = thisMsgNode.getElementsByClassName("ChatMessageOpenGraph_Description")[0].innerText;
	}
	cleanedMsgText = linkefyURL(graphURL) + '<br />' + graphTitle;
	}
//graph
	else if (checkFormatting(thisMsgNode,"ChatMessageOpenGraph")) {
	var graphURL = "";
	if (thisMsgNode.getElementsByClassName("ChatMessageOpenGraph_Title").length > 0 ){
	graphURL = thisMsgNode.getElementsByClassName("ChatMessageOpenGraph_Title")[0].href;
	}
	var graphTitle = "<h1 style='color: red'>Graph NO TITLE</h1>";
	if (thisMsgNode.getElementsByClassName("ChatMessageOpenGraph_Title").length > 0 ){
	graphTitle = thisMsgNode.getElementsByClassName("ChatMessageOpenGraph_Title")[0].innerText;
	}
	cleanedMsgText = linkefyURL(graphURL) + '<br />' + graphTitle;
	}
//me
	else if (checkIfMe(thisMsgNode)){
	cleanedMsgText = '/me ' + thisMsgNode.innerHTML;
	}
//YouTube
	else if (checkFormatting(thisMsgNode,"BBCodeYouTubeComponent")) {
	cleanedMsgText = getDataCopyTextWithLink(thisMsgNode,"BBCodeYouTubeComponent");
	}
//Img
	else if (checkFormatting(thisMsgNode,"chatImageContainer")) {
		if (typeof thisMsgNode.getElementsByClassName("FailedToLoadImage")[0] === 'object'){
		cleanedMsgText = grabFirstInnerHTMLByClass(thisMsgNode,"FailedToLoadImage");
		}
		else {
		var imgURL = getDataCopyText(thisMsgNode,"chatImageContainer");
		cleanedMsgText = '[attached image] ' + linkefyURL(imgURL);
		}
	}
//Video
	else if (checkFormatting(thisMsgNode,"chatVideoContainer")) {
	var videoURL = thisMsgNode.getElementsByClassName("chatImageURL")[0].href;
	cleanedMsgText = '[attached video] ' + linkefyURL(videoURL);
	}
//CollapsedObject
	else if (checkFormatting(thisMsgNode,"BBCodeAlreadyCollapsedText")) {
	cleanedMsgText = "[" + grabFirstInnerHTMLQueryClass(thisMsgNode,"BBCodeAlreadyCollapsedText") + "]";
	}
//Sticker
	else if (checkIfSticker(thisMsgNode)){
	var stickerURL = thisMsgNode.getElementsByTagName("img")[0].src;
	cleanedMsgText = '<br /><img class="stickerImg" src="' + stickerURL + '" alt="' + stickerURL + '" />';
	}
//Trade
	else if (checkFormatting(thisMsgNode,"TradeOfferInvite")) {
	var tradeOfferText = thisMsgNode.getElementsByClassName("inviteLabel TradeOfferInvite_Title")[0].innerText;
	var tradeOfferURLNode = thisMsgNode.getElementsByClassName("inviteURLLink").length;
	var tradeOfferURL = "null URL";
	if (tradeOfferURLNode > 0){
	tradeOfferURL = thisMsgNode.getElementsByClassName("inviteURLLink")[0].value;
	}
	cleanedMsgText = tradeOfferText + '<br />' + linkefyURL(tradeOfferURL);
	}
//Tweet
	else if (checkFormatting(thisMsgNode,"ChatMessageTweet_Body")) {
	var tweetHeader = getDataCopyText(thisMsgNode,"bbcode_ChatMessageTweet_Header_gpcGy");
	var tweetURL = getDataCopyText(thisMsgNode,"bbcode_ChatMessageTweet_Body_2mh_n");
	var tweetBody = thisMsgNode.getElementsByClassName("bbcode_ChatMessageTweet_Body_2mh_n")[0].innerText;
	var tweetFooter = thisMsgNode.getElementsByClassName("bbcode_ChatMessageTweet_Footer_11DrN")[0].innerText;
	cleanedMsgText = linkefyURL(tweetURL) + '<br />' + tweetHeader + '<br />' + tweetBody + '<br />' + tweetFooter;
	}
//Random
	else if (checkFormatting(thisMsgNode,"randomMsg")) {
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
//	var spoilerMediaHTML = thisMsgNode.getElementsByClassName("spoilerMsg")[0].innerHTML;
	cleanedMsgText = '/spoiler ' + grabFirstInnerHTMLByClass(thisMsgNode,"spoilerMsg");
	}
//flip
	else if (checkFormatting(thisMsgNode,"flipCoinAndResult")) {
	cleanedMsgText = '/flip: ' + grabFirstInnerHTMLQueryClass(thisMsgNode,"resultLabel");
	}
//StoreLink
	else if (checkFormatting(thisMsgNode,"ChatMessageSteamStore")){
	var gameTitle = thisMsgNode.querySelectorAll('[class*=ChatMessageSteamStore_Name]')[0].innerHTML;
	var gamePublisher = thisMsgNode.querySelectorAll('[class*=ChatMessageSteamStore_GameNameAndIcon]')[0].nextSibling.innerHTML;
	var gameYear = thisMsgNode.querySelectorAll('[class*=ChatMessageSteamStore_GameNameAndIcon]')[0].nextSibling.nextSibling.innerHTML;
	var gameSummary = thisMsgNode.querySelectorAll('[class*=ChatMessageSteamStore_Description]')[0].innerHTML;
	var gamePriceValue = "No Price Shown";
	var gamePriceLength = thisMsgNode.querySelectorAll('[class*=ChatMessageSteamStore_Pricing_Final]').length;
	if (gamePriceLength > 1){
	gamePriceValue = thisMsgNode.querySelectorAll('[class*=ChatMessageSteamStore_Pricing_Final]')[1].innerHTML;
	}
	var gameURL = "https://store.steampowered.com/app/" + thisMsgNode.querySelectorAll('[class*=ChatMessageSteamStore_HeaderImage]')[0].src.split('/')[5];
	cleanedMsgText = gameTitle + ' / ' + gamePublisher + ' / ' + gameYear + ' / ' + gamePriceValue  + '<br />' + gameSummary  + '<br />' +  linkefyURL(gameURL);
	}

//Invitation
	else if (checkFormatting(thisMsgNode,"ChatMessageInvite")){
		if (checkFormatting(thisMsgNode,"InviteExpired")){
		cleanedMsgText = 'A Group Chat invite was shared that is no longer valid';
		}
		else if (checkFormatting(thisMsgNode,"groupName")){
		cleanedMsgText = grabFirstInnerHTMLQueryClass(thisMsgNode,"inviteLabel") + '<br />' + grabFirstInnerHTMLQueryClass(thisMsgNode,"groupName");
		}
		else {
			cleanedMsgText = grabFirstInnerHTMLQueryClass(thisMsgNode,"inviteLabel");
			}
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
function grabFirstInnerHTMLByClass(a,b){
	var thisMsgNode = a;
	var grabThisClassName = b;
	var firstInnerHTML = thisMsgNode.getElementsByClassName(grabThisClassName)[0].innerHTML;
	return firstInnerHTML;
}
function grabFirstInnerHTMLQueryClass(a,b){
	var thisMsgNode = a;
	var grabThisClassName = "'[class*=" + b + "]'";
	var firstInnerHTML = thisMsgNode.querySelectorAll(eval(grabThisClassName))[0].innerHTML;
	return firstInnerHTML;
}
function getDataCopyText(a,b){
	var thisMsgNode = a;
	var dataCopyClassName = "'[class*=" + b + "]'";
	var dataCopyText = thisMsgNode.querySelectorAll(eval(dataCopyClassName))[0].getAttributeNode("data-copytext").value;
	return dataCopyText;
}
function getDataCopyTextWithLink(a,b){
	var thisMsgNode = a;
	var dataCopyClassName = "'[class*=" + b + "]'";
	var dataCopyText = thisMsgNode.querySelectorAll(eval(dataCopyClassName))[0].getAttributeNode("data-copytext").value;
	var dataCopyArray = dataCopyText.split("\n");
	var dataCopyURL = dataCopyArray.pop();
	var dataCopyMainText = dataCopyArray.join("");
	var getDataCopyTextWithLink = linkefyURL(dataCopyURL) + "<br />" + dataCopyMainText;
	return getDataCopyTextWithLink;
}
function addAltTextToEmoticons(a){
	var thisMsgNode = a;
	var allEmoticons = thisMsgNode.querySelectorAll('[class*=emoticon_emoticon]');
	for (var i = 0; i < allEmoticons.length; i++){
		var thisEmoticon = allEmoticons[i];
		var altText = document.createAttribute("alt");
		altText.value = thisEmoticon.getAttributeNode("data-copytext").value;
		thisEmoticon.setAttributeNode(altText);
	}
	return thisMsgNode;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// msgText type check functions
// checkIfMe(MessageNode) 	----- check if MessageNode uses /me formatting. Returns TRUE or FALSE
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function checkIfSticker(a){
	var thisMsgNode = a;
//	var canvasLength = thisMsgNode.getElementsByTagName("canvas").length;
	var imgLength = thisMsgNode.getElementsByTagName("img").length;
//	if (canvasLength < 1 || imgLength < 1){
	if (imgLength < 1){
	return false;
	}
	else {
	var urlSrc = thisMsgNode.getElementsByTagName("img")[0].src;
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
