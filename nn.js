/* 
	Hacker's guide to Neural Networks by Andrej Karpathy.
	Comments are the notes taken by me.
*/



/* 

What is a real-valued circuit ?

Circuits in which real-valus flow instead of usual boolen values [0, 1 / F, T].
Example: Binary - *, +, -, /, max(); Unary - exp(), pow()

*/

// f(x, y) = xy
var forwardMultiplyGate = function(x, y) {
	return x * y;
};
forwardMultiplyGate(3, 2) // 6



// Given a circuit and input values
// Ouput is calculated by the circuit by performing the operations
// HOW TO CHANGE THE INPUT TO CHANGE THE OUTPUTS IN DESIRED MANNER

// e.g, in the above gate or fn, how to change x, y to output higher value ?
// let's say, x = 3 and y = 2; f(x, y) = 6
// if x = 2.99 * 2.01 = 6.0099

// Startegy #1: Random *Local* Search
// To try random values near the inputs (local) and find what works best

var x = 3, y = 2; // some input values

var tweak_amount = 0.01;
var best_out = -Infinity;
var best_x = x, best_y = y;

for (var k = 0; k < 1000; k++) {

	// We are using tweak amount to limit the size of the random number generated
	// (* 2 - 1) expression makes the random number genrated from -1 to +1
	// Math.random() * (max - min) + min

	var x_try = x + tweak_amount * (Math.random() * 2 - 1);
	var y_try = y + tweak_amount * (Math.random() * 2 - 1);
	var out = forwardMultiplyGate(x_try, y_try);

	if (out > best_out) {
		best_out = out;
		best_x = x_try, best_y = y_try;
	}
}

(best_out, best_x, best_y); // ~ 6.048, 3.009, 2.009

// Startegy #2: Numerical Gradient
// calculating the derivate and checking what happens to output
// if the input is changed by h

// df(x, y)/dx = f(x + h, y) - f(x, y) / h

var out = forwardMultiplyGate(x, y);
var h = 0.0001;

// calculating the derivative with respect to x
var xph = x + h; // 3.0001
var out2 = forwardMultiplyGate(xph, y); // 6.0002
var x_derivate = (out2 - out) / h; // 2

// calulating the derivative with respect to y
var yph = y + h; // 2.0001
var out3 = forwardMultiplyGate(x, yph); // 6.0003
var y_derivative = (out3 - out) / h; // 3


// adding the values to inputs

// What is the need of step-size here ?
// Step-size allows the gradient to not to overshoot target.
// Having a low step-size gurantees that no other direction could have worked better

var step_size = 0.01;

x = x + step_size * x_derivate;
y = y + step_size * y_derivative; 

var out_new = forwardMultiplyGate(x, y); // 6.13

// Startegy #3: Analytic Gradient
// Calculate derivates using Mathematics.

var x_gradient = y;
var y_gradinet = x;

var step_size = 0.01;
x += step_size * x_gradient;
y += step_size * y_gradinet;
var out_new = forwardMultiplyGate(x, y);

/*
 all Neural Network libraries always compute the analytic gradient,
 but the correctness of the implementation is verified by comparing 
 it to the numerical gradient.
*/

// RECURSIVE CASE: CIRCUITS WITH MULTIPLE GATES

// f(x, y, z) = (x + y)z

var forwardMultiplyGate = function(a, b) {
	return a * b;
}
var forwardAddGate = function(a, b) {
	return a + b;
}
var forwardCircuit = function(x, y, z) {
	var q = forwardAddGate(x, y);
	var f = forwardMultiplyGate(q, z);
	return f;
}

// BACKPROPAGATION

var x = -2, y = 5, z = -4;
var q = forwardAddGate(x, y);
var f = forwardMultiplyGate(q, z);

// MULTIPLY gates derivatives
var derivative_f_wrt_z = q;
var derivative_f_wrt_q = z;


// ADD Gates derivatives
var derivative_q_wrt_x = 1;
var derivative_q_wrt_y = 1;

// chain rule
var derivative_f_wrt_x = derivative_q_wrt_x * derivative_f_wrt_q;
var derivative_f_wrt_y = derivative_q_wrt_y * derivative_f_wrt_q;

var grad_f_wrt_xyz = [derivative_f_wrt_x, derivative_f_wrt_y, derivative_f_wrt_z];

var step_size = 0.01;
x = x + step_size * derivative_f_wrt_x;
y = y + step_size * derivative_f_wrt_y;
z = z + step_size * derivative_f_wrt_z;


// numerical gradient check
var h = 0.0001;

// we are dividing by h to normalize the expression
var x_derivate = (forwardCircuit(x+h,y,z) - forwardCircuit(x, y, z)) / h;
var y_derivative = (forwardCircuit(x,y+h,z) - forwardCircuit(x,y,z)) / h;
var z_derivative = (forwardCircuit(x,y,z+h) - forwardCircuit(x,y,z)) / h;


// TODO