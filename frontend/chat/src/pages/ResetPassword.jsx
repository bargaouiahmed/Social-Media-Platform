import { useState } from "react";
import { djangoApi } from "../api";
import { useNavigate } from "react-router-dom";
export default function ResetPassword() {
  const [username, setUsername] = useState("");
  const [answer, setAnswer] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [error, setError] = useState(null);
  const [isUsernameSubmitted, setIsUsernameSubmitted] = useState(false);
  const [isQuestionAnswered, setIsQuestionAnswered] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [new_password, setNewPassword] = useState("");
  const [confirm_password, setConfirmPassword] = useState("");
const navigate=useNavigate()
  const handleChange = (e) => {
    setUsername(e.target.value);
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await djangoApi.checkSecurityQuestion(username);
      setSecurityQuestion(response.data.question);
      setIsUsernameSubmitted(true);
    } catch (error) {
      setError("User with given username does not exist");
    }
  };

  const handleAnswerChange = (e) => {
    setAnswer(e.target.value);
  };

  const handlePasswordsChange = (e) => {
    if (e.target.name === "new_password") {
      setNewPassword(e.target.value);
    } else {
      setConfirmPassword(e.target.value);
    }
  };

  const handleSecurityQuestionSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await djangoApi.respondToQuestion(username, answer);
      console.log("question submitted", response);
      setIsQuestionAnswered(true);
      setError(null);
    } catch (error) {
      console.log("your error", error.message);
      const errorMessage = error.response?.data?.error || "Incorrect answer to security question";
      setError(errorMessage);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (new_password !== confirm_password) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await djangoApi.changePassword(
        username,
        answer,
        new_password,
        confirm_password
      );
      console.log("password changed", response);
      setIsSuccess(true);

      setError(null);
      navigate("/login")
    } catch (error) {
      console.log("your error", error.message);
      const errorMessage = error.response?.data?.error || "Failed to change password";
      setError(errorMessage);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Reset Password</h1>

      {!isUsernameSubmitted ? (
        // Step 1: Username form
        <form onSubmit={handleUsernameSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded"
          >
            Continue
          </button>
        </form>
      ) : isSuccess ? (
        // Step 4: Success message
        <div className="text-green-500">
          <p>Password changed successfully!</p>
        </div>
      ) : !isQuestionAnswered ? (
        // Step 2: Security question form
        <form onSubmit={handleSecurityQuestionSubmit}>
          <div className="mb-4">
            <p className="mb-2"><strong>Security Question:</strong></p>
            <p className="mb-4">{securityQuestion}</p>

            <label className="block mb-2">Your Answer</label>
            <input
              type="text"
              value={answer}
              onChange={handleAnswerChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded"
          >
            Submit Answer
          </button>
        </form>
      ) : (
        // Step 3: New password form
        <form onSubmit={handleChangePassword}>
          <div className="mb-4">
            <label className="block mb-2">New Password</label>
            <input
              type="password"
              name="new_password"
              value={new_password}
              onChange={handlePasswordsChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirm_password"
              value={confirm_password}
              onChange={handlePasswordsChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded"
          >
            Reset Password
          </button>
        </form>
      )}
    </div>
  );
}
