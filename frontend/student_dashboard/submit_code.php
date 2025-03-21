<?php
header("Content-Type: application/json");
$data = json_decode(file_get_contents("php://input"), true);
$code = $data["code"];
$language = $data["language"];

$expected_output = "Hello, World!"; // Hardcoded for testing
$file = "temp_code";
$command = "";

switch ($language) {
    case "python":
        $file .= ".py";
        file_put_contents($file, $code);
        $command = "python $file 2>&1";
        break;
    case "java":
        $file .= ".java";
        file_put_contents($file, $code);
        $command = "javac $file && java temp_code 2>&1";
        break;
    case "c":
        $file .= ".c";
        file_put_contents($file, $code);
        $command = "gcc $file -o temp_code.out && ./temp_code.out 2>&1";
        break;
    case "cpp":
        $file .= ".cpp";
        file_put_contents($file, $code);
        $command = "g++ $file -o temp_code.out && ./temp_code.out 2>&1";
        break;
    default:
        echo json_encode(["message" => "Unsupported language"]);
        exit();
}

$output = shell_exec($command);
if (trim($output) == $expected_output) {
    echo json_encode(["message" => "Submitted"]);
} else {
    echo json_encode(["message" => "Error: Expected '$expected_output' but got '$output'"]);
}

unlink($file);
?>
