import numpy as np
import pandas as pd
import pulp as pl
from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import os
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)  # Enable CORS for the entire app

class Assignment:
    @staticmethod
    def cosine_similarity(vec_a, vec_b):
        """Compute the cosine similarity between two vectors."""
        dot_product = np.dot(vec_a, vec_b)
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        if norm_a == 0 or norm_b == 0:
            return 0
        return dot_product / (norm_a * norm_b)

    @classmethod
    def GMRA(cls, Q, L, La, a):
        row = len(Q)
        col = len(L)
        
        # Build an optimization problem
        pro = pl.LpProblem('Maximized muscle usage', pl.LpMaximize)
        
        # Build variables for the optimization problem
        lpvars = [[pl.LpVariable(f"x{i}y{j}", lowBound=0, upBound=1, cat='Binary') for j in range(col)] for i in range(row)]
        agent_used = [pl.LpVariable(f"agent_used_{i}", lowBound=0, upBound=1, cat='Binary') for i in range(row)]
        
        # Build the objective function
        all_expr = pl.lpSum(Q[i][j] * lpvars[i][j] * Q[i][j] for i in range(row) for j in range(col) if Q[i][j] > 0)
        pro += all_expr
        
        # Build constraints for each role
        for j in range(col):
            role_constraint = pl.lpSum(lpvars[i][j] for i in range(row))
            pro += (role_constraint == L[j]), f"L{j}"
        
        # Build constraints for each agent
        for i in range(row):
            pro += (pl.lpSum(lpvars[i][j] for j in range(col)) <= La[i]), f"La{i}"
            pro += (pl.lpSum(lpvars[i][j] for j in range(col)) <= La[i] * agent_used[i]), f"AgentUsedConstraint_{i}"
        
        # Limit the maximum number of agents used
        pro += (pl.lpSum(agent_used[i] for i in range(row)) <= a), "MaxAgentsConstraint"
        
        # Ensure at least 'a' pairs are picked
        total_assignments = pl.lpSum(lpvars[i][j] for i in range(row) for j in range(col))
        pro += (total_assignments >= a), "AtLeastAAssignments"
        
        # Solve the problem
        status = pro.solve(pl.PULP_CBC_CMD(msg=True))
        
        # Extract the solution
        T_matrix = [[lpvars[i][j].varValue for j in range(col)] for i in range(row)]
        T_pairs = [(i, j) for i in range(row) for j in range(col) if lpvars[i][j].varValue == 1 and Q[i][j] > 0]
        objective_value = pl.value(pro.objective)

        # Debugging outputs
        agent_usage = [agent_used[i].varValue for i in range(row)]
        used_agents_count = sum(agent_usage)
        assignments_count = len(T_pairs)
        
        print("Agent usage:", agent_usage)
        print("Total used agents:", used_agents_count)
        print("Total assignments (pairs):", assignments_count)
        print("Assignments (pairs):", T_pairs)
        
        return T_matrix, pl.LpStatus[status], objective_value, T_pairs


@app.route('/api/shuffle', methods=['POST'])
def shuffle_endpoint():
    data = request.json
    T_matrix = data.get('T_matrix')
    
    if T_matrix is None:
        return jsonify({"error": "T_matrix not provided"}), 400
    
 

# Get the current script's directory
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # Relative path to the qMatrix.csv file
    q_matrix_path = os.path.join(current_dir,  'qMatrix.csv')
 
    try:
        # Load the CSV, treating the first column as the index (exercise names)
        df = pd.read_csv(q_matrix_path, header=0, index_col=0)  # 'index_col=0' makes the first column the index

        # The DataFrame is already loaded, now extract the exercise names (index)
        exercise_names = df.index.tolist()
        print("Exercise Names:", exercise_names)
        print("Q_matrix loaded successfully:", df)

        # Now Q_matrix is a DataFrame containing the numerical data with exercise names as index
        Q_matrix = df  # Keep Q_matrix as a DataFrame

    except FileNotFoundError:
        return jsonify({'error': 'qMatrix.csv file not found'}), 400
    except Exception as e:
        return jsonify({'error': f'Error loading CSV: {str(e)}'}), 400

    # Debugging print to check the exercise names and the matrix (DataFrame)
    print("Exercise Names:", exercise_names)
    print("Q_matrix (DataFrame):", Q_matrix)

    # Retrieve muscle_index and exercise_name from the request data
    muscle_index = data.get('muscle_index')
    exercise_name = data.get('muscle_name')
    
    if muscle_index is None or not isinstance(muscle_index, int) or not (0 <= muscle_index < len(Q_matrix.columns) - 1):  # Exclude the name column
        return jsonify({'error': 'Valid muscle_index is required'}), 400

    if exercise_name is None or not isinstance(exercise_name, str):
        return jsonify({'error': 'Valid muscle_name is required'}), 400
    
    # Map exercise name to index based on the first column in Q_matrix
    if exercise_name not in exercise_names:
        return jsonify({'error': 'Invalid exercise name'}), 400
    
    exercise_index = exercise_names.index(exercise_name)
    print(f"Index of {exercise_name}: {exercise_index}")

    exercise_row = T_matrix[exercise_index]

    # Find indices of non-zero values in the row
    non_zero_indices = [index for index, value in enumerate(exercise_row) if value != 0]

    # Return the non-zero indices
    print("Non-zero indices:", non_zero_indices)
    # Extract columns starting from the second column (ignoring the first column)
    Q_matrix_no_labels = Q_matrix.iloc[:, 1:]

    # Now, iterate over the non-zero indices and access values from each column
   
    vectA = [Q_matrix.iloc[exercise_index, index] for index in non_zero_indices]
    print("VectA:", vectA)
    # Compute cosine similarity
    best_value = -1  # Initialize best_value to a very low number
    best_index = None
    
    for i in range(len(T_matrix)):  # Use `len(T_matrix)` for row iteration
        vectB = [Q_matrix.iloc[i, index] for index in non_zero_indices]
        # Check cosine similarity between `vectA` and `vectB`
        similarity_value = cosine_similarity([vectA], [vectB])[0][0]  # Ensure to pass 2D arrays to `cosine_similarity`
        
        # Check if T_matrix row has no non-zero values before updating
        if similarity_value > best_value and all(val == 0 for val in T_matrix[i]):
            best_value = similarity_value
            new_exercise = i  # Store the index of the new exercise


    # Change the values at `non_zero_indices` for the row `new_exercise` from 0 to 1
    for index in non_zero_indices:
        T_matrix[exercise_index][index] = 0  # Update value from 1 to 0 for old exercise
        T_matrix[new_exercise][index] = 1  # Update value from 0 to 1 for new
    
    print("TMAtrix:", T_matrix)
    print("vectB:", vectB)


    return jsonify({
        'T_matrix': T_matrix,
        'new_exercise_index': new_exercise,
        'new_exercise_name': exercise_names[new_exercise]  
    }), 200


@app.route('/api/spaceout', methods=['POST'])
def space_out_rows():
    data = request.json
    if not data or 'parsedTMatrix' not in data or 'uniqueRowIndices' not in data:
        print("Invalid input:", data)
        return jsonify({"error": "Invalid input, 'parsedTMatrix' and 'uniqueRowIndices' are required"}), 400

    # Convert the matrix to a NumPy array
    matrix = np.array(data['parsedTMatrix'])
    unique_row_indices = data['uniqueRowIndices']

    # Pair each row with its original index
    paired_rows = list(zip(matrix, unique_row_indices))
    paired_rows.sort(key=lambda x: (-np.sum(x[0]), x[1]))

    # Reorder rows to minimize overlap
    spaced_rows = [paired_rows.pop(0)]

    while paired_rows:
        last_row = spaced_rows[-1][0]

        # Find the next best row that minimizes overlapping 1s
        best_row = min(paired_rows, key=lambda x: np.sum(last_row & x[0]))

        # Use an explicit index-based removal instead of remove()
        best_row_index = next(
            idx for idx, row in enumerate(paired_rows) if np.array_equal(row[0], best_row[0])
        )
        paired_rows.pop(best_row_index)

        spaced_rows.append(best_row)

    # Separate spaced rows and their indices
    result_matrix, reordered_indices = zip(*spaced_rows)

    # Convert NumPy types to native Python types for JSON serialization
    result_matrix = [list(map(int, row)) for row in result_matrix]  # Convert rows to lists of ints
    reordered_indices = list(map(int, reordered_indices))  # Convert indices to list of ints

    return jsonify({"balancedTmatrix": result_matrix, "reorderedIndices": reordered_indices})

# for gmra_Endpoint
@app.route('/api/gmra', methods=['POST'])
def gmra_endpoint():
    data = request.json
    L = data.get('L', [])
    amount = data.get('amount', None)

    if not L:
        return jsonify({'error': 'L array is required'}), 400
    
    if amount is None:
        return jsonify({'error': 'amount is required'}), 400

    La = [3, 4, 4, 4, 5, 3, 3, 4, 5, 6, 3, 4, 4, 3, 4, 3, 4, 4, 4, 3, 4, 3, 4, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4]

    current_dir = os.path.dirname(os.path.abspath(__file__))

    # Relative path to the qMatrix.csv file
    q_matrix_path = os.path.join(current_dir,  'qMatrix.csv')
    print(q_matrix_path)

    try:
            # Load the CSV into a DataFrame, skipping the header row
        df = pd.read_csv(q_matrix_path, header=0)  # The first row will be treated as column headers

        # Remove the first column (exercise names) by selecting all columns except the first
        df = df.iloc[:, 1:]  # Skip the first column

        # Convert the remaining data to numeric, coercing errors (non-numeric becomes NaN)
        df = df.apply(pd.to_numeric, errors='coerce')

        # Convert the DataFrame to a list of lists (matrix format)
        Q_matrix = df.values.tolist()
        print("Q_matrix:", Q_matrix)
    except FileNotFoundError:
        return jsonify({'error': 'qMatrix.csv file not found'}), 400

    T_matrix, status, objective_value, T_pairs = Assignment.GMRA(Q_matrix, L, La, amount)

    # Ensure T_matrix is a 2D array and check its shape
    if isinstance(T_matrix, list):
        max_length = max(len(row) for row in T_matrix)  # Get the maximum length
        T_matrix = np.array([row + [None] * (max_length - len(row)) for row in T_matrix])  # Pad rows
        print("Padded T_matrix:", T_matrix)

    print("Shape of T_matrix:", T_matrix.shape)

    return jsonify({
        'T_matrix': T_matrix.tolist(),
        'status': status,
        'objective_value': objective_value,
        'T_pairs': T_pairs
    })
if __name__ == '__main__':
    app.run(debug=True)