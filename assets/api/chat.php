<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die('Method not allowed');
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://aitacademyindia.com');

$API_KEY = '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';

$body = file_get_contents('php://input');

if (!json_decode($body)) {
    http_response_code(400);
    die('Invalid JSON');
}

$ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $API_KEY,
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'Request failed']);
    curl_close($ch);
    die();
}

curl_close($ch);
http_response_code($httpCode);
echo $response;
