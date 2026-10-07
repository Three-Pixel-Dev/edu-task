import type { Question } from '@/types';

/**
 * Mock question banks.
 *
 * Subject banks (DBMS, Operating System) hold subject-specific questions;
 * every other subject draws from its field bank. In Firestore these become
 * documents in the `questions` collection keyed by subjectId / fieldId.
 */

type Seed = [prompt: string, options: [string, string, string, string], correctIndex: 0 | 1 | 2 | 3, explanation: string];

const LETTERS = ['a', 'b', 'c', 'd'] as const;

function bank(prefix: string, scope: { fieldId: string; subjectId?: string }, seeds: Seed[]): Question[] {
  return seeds.map(([prompt, options, correctIndex, explanation], index) => {
    const id = `${prefix}-${String(index + 1).padStart(2, '0')}`;
    return {
      id,
      ...scope,
      prompt,
      options: options.map((text, i) => ({ id: `${id}-${LETTERS[i]}`, text })),
      correctOptionId: `${id}-${LETTERS[correctIndex]}`,
      explanation,
    };
  });
}

// ── Subject banks ────────────────────────────────────────────────────────
const dbms = bank('dbms', { fieldId: 'software', subjectId: 'ceit-4031' }, [
  ['Which of the following is a relational database?', ['MongoDB', 'PostgreSQL', 'Redis', 'Neo4j'], 1, 'PostgreSQL stores data in related tables that are queried with SQL.'],
  ['Which JOIN returns only rows with matching values in both tables?', ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL OUTER JOIN'], 2, 'INNER JOIN keeps only the rows that match on both sides.'],
  ['In ACID, what does the “I” stand for?', ['Integrity', 'Isolation', 'Indexing', 'Idempotence'], 1, 'Isolation stops concurrent transactions from interfering with each other.'],
  ['Which clause filters groups after aggregation?', ['WHERE', 'ORDER BY', 'HAVING', 'GROUP BY'], 2, 'HAVING filters grouped results; WHERE filters individual rows.'],
  ['A foreign key is used to:', ['Speed up every query', 'Link rows between tables', 'Encrypt a column', 'Store large files'], 1, 'A foreign key references the key of a row in another table.'],
  ['Which index structure do most relational databases use by default?', ['Hash table', 'B+ tree', 'Linked list', 'Stack'], 1, 'B+ trees keep keys sorted, which also supports range queries.'],
  ['Which statement undoes changes that have not been committed?', ['COMMIT', 'SAVEPOINT', 'ROLLBACK', 'GRANT'], 2, 'ROLLBACK returns the data to its state at the last commit.'],
  ['In an ER diagram, a diamond usually represents:', ['An entity', 'An attribute', 'A relationship', 'A primary key'], 2, 'Rectangles are entities, ovals are attributes and diamonds are relationships.'],
  ['Which SQL command adds new rows to a table?', ['UPDATE', 'INSERT', 'ALTER', 'CREATE'], 1, 'INSERT INTO adds rows; UPDATE changes existing ones.'],
  ['Which SQL command removes every row but keeps the table structure?', ['DELETE TABLE', 'DROP TABLE', 'TRUNCATE TABLE', 'REMOVE ROWS'], 2, 'TRUNCATE clears the data and keeps the table definition.'],
  ['A primary key must be:', ['Unique and not null', 'Unique but nullable', 'Repeated across rows', 'Always a foreign key'], 0, 'Each row needs a unique, non-null identifier.'],
  ['Which normal form removes partial dependencies?', ['1NF', '2NF', '3NF', 'BCNF'], 1, '2NF requires every non-key attribute to depend on the whole key.'],
]);

const operatingSystem = bank('os', { fieldId: 'software', subjectId: 'ceit-5051' }, [
  ['Which scheduling algorithm can cause starvation of long processes?', ['Round Robin', 'Shortest Job First', 'First Come First Served', 'FIFO queue'], 1, 'SJF keeps picking short jobs, so long jobs may wait indefinitely.'],
  ['A deadlock requires all of these EXCEPT:', ['Mutual exclusion', 'Hold and wait', 'Preemption', 'Circular wait'], 2, 'Deadlock needs no preemption; allowing preemption breaks it.'],
  ['What does a page table map?', ['Files to disk blocks', 'Virtual pages to physical frames', 'Processes to CPUs', 'Users to permissions'], 1, 'The page table translates virtual page numbers into physical frame numbers.'],
  ['Thrashing happens when:', ['The CPU overheats', 'Processes spend most time paging', 'Disk space runs out', 'Too many threads finish'], 1, 'With too few frames, the system spends more time swapping pages than executing.'],
  ['Which is shared between threads of the same process?', ['Stack', 'Program counter', 'Registers', 'Heap memory'], 3, 'Threads share the heap and code; each thread has its own stack and registers.'],
  ['A semaphore is mainly used for:', ['File compression', 'Process synchronisation', 'Memory allocation', 'Disk formatting'], 1, 'Semaphores coordinate access to shared resources.'],
  ['Which page replacement algorithm is optimal but impractical?', ['FIFO', 'LRU', 'OPT (Belady’s)', 'Clock'], 2, 'OPT needs future knowledge of references, so it is only a benchmark.'],
  ['The kernel runs in:', ['User mode', 'Privileged (kernel) mode', 'Guest mode', 'Batch mode'], 1, 'The kernel needs privileged mode to access hardware directly.'],
  ['A context switch saves and restores:', ['The file system', 'The CPU state of a process', 'The whole RAM', 'Network sockets'], 1, 'Registers, program counter and other CPU state are saved in the PCB.'],
  ['Round Robin scheduling uses a:', ['Priority queue', 'Time quantum', 'Deadline', 'Lottery ticket'], 1, 'Each process runs for at most one time quantum before being preempted.'],
]);

// ── Field banks ──────────────────────────────────────────────────────────
const hardware = bank('hw', { fieldId: 'electronic-hardware' }, [
  ['Which logic gate outputs 1 only when both inputs are 1?', ['OR', 'AND', 'XOR', 'NOR'], 1, 'AND is true only when every input is true.'],
  ['How many bits are in one byte?', ['4', '8', '16', '32'], 1, 'A byte is 8 bits.'],
  ['Which gate is called a universal gate?', ['XOR', 'NAND', 'OR', 'NOT'], 1, 'Any Boolean function can be built from NAND gates alone.'],
  ['The binary number 1011 equals which decimal value?', ['9', '10', '11', '13'], 2, '8 + 0 + 2 + 1 = 11.'],
  ['Which register holds the address of the next instruction?', ['Accumulator', 'Program counter', 'Stack pointer', 'Status register'], 1, 'The program counter points to the next instruction to fetch.'],
  ['Cache memory is placed between:', ['CPU and main memory', 'Disk and network', 'RAM and disk only', 'Keyboard and CPU'], 0, 'Cache reduces the average time the CPU needs to access main memory.'],
  ['A flip-flop stores:', ['One bit', 'One byte', 'One word', 'Nothing'], 0, 'A flip-flop is a 1-bit memory element.'],
  ['Which component converts AC to DC?', ['Transistor', 'Rectifier', 'Capacitor', 'Inductor'], 1, 'A rectifier uses diodes to convert alternating current to direct current.'],
  ['In pipelining, a data hazard occurs when:', ['Power fails', 'An instruction needs a result not yet produced', 'Cache is full', 'The clock is too slow'], 1, 'Dependent instructions can read values before earlier ones write them.'],
  ['Which bus carries the memory location to read or write?', ['Data bus', 'Address bus', 'Control bus', 'USB'], 1, 'The address bus selects the memory location.'],
]);

const software = bank('sw', { fieldId: 'software' }, [
  ['Which principle hides an object’s internal state?', ['Inheritance', 'Encapsulation', 'Polymorphism', 'Recursion'], 1, 'Encapsulation exposes behaviour through methods and hides data.'],
  ['What is the time complexity of binary search?', ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], 1, 'Each step halves the search space.'],
  ['Which data structure works on Last In, First Out?', ['Queue', 'Stack', 'Linked list', 'Tree'], 1, 'A stack removes the most recently added item first.'],
  ['Which SDLC model completes each phase before the next starts?', ['Agile', 'Waterfall', 'Spiral', 'Scrum'], 1, 'Waterfall is sequential: requirements, design, build, test, deploy.'],
  ['Method overriding is an example of:', ['Encapsulation', 'Runtime polymorphism', 'Abstraction only', 'Compilation'], 1, 'The method that runs is chosen at runtime from the object’s actual type.'],
  ['Which sorting algorithm has O(n log n) average time?', ['Bubble sort', 'Insertion sort', 'Merge sort', 'Selection sort'], 2, 'Merge sort divides and merges in O(n log n).'],
  ['Unit testing checks:', ['The whole system', 'Individual functions or classes', 'User satisfaction', 'Network speed'], 1, 'Unit tests verify the smallest testable parts in isolation.'],
  ['Git is a:', ['Database', 'Distributed version control system', 'Compiler', 'Web server'], 1, 'Git tracks changes; every clone has the full history.'],
  ['Which structure is used for breadth-first search?', ['Stack', 'Queue', 'Heap', 'Hash map'], 1, 'BFS visits nodes level by level using a queue.'],
  ['A REST API typically uses which method to update a resource?', ['GET', 'PUT', 'TRACE', 'HEAD'], 1, 'PUT (or PATCH) updates a resource; GET only reads.'],
]);

const network = bank('net', { fieldId: 'network-communication' }, [
  ['Which OSI layer is responsible for routing?', ['Data link', 'Network', 'Transport', 'Session'], 1, 'The network layer (layer 3) routes packets between networks.'],
  ['Which protocol guarantees reliable, ordered delivery?', ['UDP', 'TCP', 'IP', 'ICMP'], 1, 'TCP uses acknowledgements and sequencing.'],
  ['What is the default port for HTTPS?', ['21', '80', '443', '8080'], 2, 'HTTPS uses port 443; HTTP uses 80.'],
  ['How many bits are in an IPv4 address?', ['16', '32', '64', '128'], 1, 'IPv4 addresses are 32 bits, written as four octets.'],
  ['Which device forwards frames using MAC addresses?', ['Router', 'Switch', 'Repeater', 'Modem'], 1, 'Switches work at layer 2 and use MAC addresses.'],
  ['DNS translates:', ['IP to MAC', 'Domain names to IP addresses', 'Analog to digital', 'Ports to services'], 1, 'DNS resolves human-readable names to IP addresses.'],
  ['Which protocol assigns IP addresses automatically?', ['FTP', 'DHCP', 'SMTP', 'ARP'], 1, 'DHCP leases addresses to hosts on the network.'],
  ['A /24 subnet mask is:', ['255.0.0.0', '255.255.0.0', '255.255.255.0', '255.255.255.255'], 2, '24 network bits = 255.255.255.0.'],
  ['Which medium is least affected by electromagnetic interference?', ['Twisted pair', 'Coaxial cable', 'Optical fibre', 'Radio'], 2, 'Fibre carries light, so it is immune to EMI.'],
  ['ARP is used to find:', ['A domain name', 'A MAC address from an IP address', 'The default gateway', 'The DNS server'], 1, 'ARP maps a known IP address to a hardware (MAC) address.'],
]);

const security = bank('sec', { fieldId: 'security' }, [
  ['Which algorithm is symmetric?', ['RSA', 'AES', 'ECC', 'Diffie–Hellman'], 1, 'AES uses the same key to encrypt and decrypt.'],
  ['The CIA triad stands for:', ['Control, Integrity, Access', 'Confidentiality, Integrity, Availability', 'Cipher, Identity, Audit', 'Confidentiality, Identity, Authorisation'], 1, 'These are the three core goals of information security.'],
  ['A hash function should be:', ['Reversible', 'One-way', 'Random every time', 'Key-dependent only'], 1, 'You should not be able to recover the input from a hash.'],
  ['Phishing is an example of:', ['Social engineering', 'A buffer overflow', 'Encryption', 'A firewall rule'], 0, 'Phishing tricks people into revealing information.'],
  ['Which attack injects code through user input fields?', ['DDoS', 'SQL injection', 'Sniffing', 'Spoofing'], 1, 'Unsanitised input can be executed as SQL.'],
  ['A digital signature mainly provides:', ['Compression', 'Authenticity and integrity', 'Faster transfer', 'Anonymity'], 1, 'It proves who signed and that the data was not altered.'],
  ['Which device filters traffic using rules?', ['Hub', 'Firewall', 'Repeater', 'Bridge'], 1, 'Firewalls allow or block traffic based on rules.'],
  ['Multi-factor authentication combines:', ['Two passwords', 'Different types of evidence', 'Two usernames', 'Encryption and hashing'], 1, 'For example something you know plus something you have.'],
  ['In RSA, the public key is used to:', ['Decrypt private messages', 'Encrypt messages for the key owner', 'Generate random numbers', 'Hash passwords'], 1, 'Only the matching private key can decrypt them.'],
  ['A salt is added to passwords to:', ['Make them shorter', 'Defeat precomputed (rainbow table) attacks', 'Encrypt them', 'Speed up login'], 1, 'Unique salts make identical passwords hash differently.'],
]);

const dataScience = bank('ds', { fieldId: 'data-science' }, [
  ['Which measure is most affected by outliers?', ['Median', 'Mode', 'Mean', 'Interquartile range'], 2, 'Extreme values pull the mean toward them.'],
  ['Supervised learning requires:', ['Unlabelled data', 'Labelled training data', 'No data', 'Only images'], 1, 'Models learn from input–label pairs.'],
  ['k-means is an example of:', ['Classification', 'Clustering', 'Regression', 'Reinforcement learning'], 1, 'k-means groups unlabelled points into k clusters.'],
  ['Overfitting means a model:', ['Performs well on new data', 'Memorises training data and generalises poorly', 'Is too simple', 'Has no parameters'], 1, 'It fits noise in the training set.'],
  ['Which chart best shows a distribution of one numeric variable?', ['Pie chart', 'Histogram', 'Line chart', 'Gantt chart'], 1, 'Histograms bin values to show their distribution.'],
  ['Precision is defined as:', ['TP / (TP + FN)', 'TP / (TP + FP)', 'TN / (TN + FP)', '(TP + TN) / total'], 1, 'Of all predicted positives, how many were correct.'],
  ['Which algorithm predicts a continuous value?', ['Logistic regression', 'Linear regression', 'Decision tree classifier', 'k-means'], 1, 'Linear regression outputs a real number.'],
  ['A correlation coefficient of −1 means:', ['No relationship', 'Perfect negative linear relationship', 'Perfect positive relationship', 'Random noise'], 1, 'As one variable rises, the other falls exactly linearly.'],
  ['Which split is commonly used to evaluate a model?', ['Train / test', 'Read / write', 'Input / output', 'Front / back'], 0, 'Hold out test data the model never saw during training.'],
  ['Hadoop’s storage layer is called:', ['HDFS', 'NTFS', 'MapView', 'SQLFS'], 0, 'HDFS distributes files across a cluster.'],
]);

const signal = bank('sig', { fieldId: 'signal-processing' }, [
  ['The Nyquist rate is:', ['Half the highest frequency', 'Twice the highest frequency', 'Equal to the bandwidth', 'Ten times the frequency'], 1, 'Sample at least twice the highest frequency to avoid aliasing.'],
  ['Aliasing occurs when:', ['Sampling is too slow', 'Signals are amplified', 'Noise is filtered', 'Data is encrypted'], 0, 'Under-sampling makes high frequencies appear as low ones.'],
  ['The Fourier transform converts a signal into the:', ['Time domain', 'Frequency domain', 'Spatial domain only', 'Binary domain'], 1, 'It shows which frequencies a signal contains.'],
  ['A low-pass filter:', ['Removes low frequencies', 'Passes low frequencies and attenuates high ones', 'Amplifies all frequencies', 'Passes only DC'], 1, 'It smooths a signal by removing fast changes.'],
  ['FFT is an efficient algorithm for computing the:', ['DFT', 'Laplace transform', 'Z-score', 'Convolution only'], 0, 'The FFT computes the Discrete Fourier Transform in O(n log n).'],
  ['In image processing, a pixel is:', ['A frequency', 'The smallest picture element', 'A colour model', 'A filter'], 1, 'An image is a grid of pixels.'],
  ['Which filter is commonly used to reduce salt-and-pepper noise?', ['Median filter', 'High-pass filter', 'Sobel filter', 'Laplacian'], 0, 'The median ignores extreme pixel values.'],
  ['An LTI system is fully described by its:', ['Input only', 'Impulse response', 'Power rating', 'Sampling rate'], 1, 'Convolving with the impulse response gives any output.'],
  ['Quantisation converts:', ['Continuous amplitudes to discrete levels', 'Time to frequency', 'Colour to greyscale', 'Digital to analog'], 0, 'Each sample is rounded to the nearest level.'],
  ['The unit of frequency is:', ['Watt', 'Hertz', 'Ohm', 'Decibel'], 1, 'One hertz is one cycle per second.'],
]);

const projectManagement = bank('pm', { fieldId: 'project-management' }, [
  ['The critical path is the:', ['Shortest path in a project network', 'Longest sequence of dependent tasks', 'Most expensive task', 'First task'], 1, 'Any delay on it delays the whole project.'],
  ['A Gantt chart shows:', ['Code coverage', 'Tasks against time', 'Network topology', 'Budget only'], 1, 'Bars show when each task starts and ends.'],
  ['The triple constraint is:', ['Scope, time, cost', 'People, process, tools', 'Plan, do, check', 'Risk, issue, change'], 0, 'Changing one usually affects the others.'],
  ['In Scrum, a sprint is:', ['A bug report', 'A fixed time-box of work', 'A release note', 'A test case'], 1, 'Sprints are usually one to four weeks.'],
  ['Which document formally authorises a project?', ['Project charter', 'Test plan', 'User manual', 'Invoice'], 0, 'The charter names the sponsor, goals and the project manager.'],
  ['A risk register records:', ['Employee salaries', 'Identified risks and responses', 'Source code', 'Meeting minutes only'], 1, 'It tracks likelihood, impact and owners.'],
  ['Plagiarism in a project report is:', ['Acceptable with friends', 'Presenting others’ work as your own', 'A citation style', 'A type of backup'], 1, 'Always credit sources you use.'],
  ['WBS stands for:', ['Web-Based System', 'Work Breakdown Structure', 'Weekly Budget Summary', 'Workflow Build Script'], 1, 'It splits the project into smaller deliverables.'],
  ['A milestone has:', ['Long duration', 'Zero duration', 'No deadline', 'Many owners'], 1, 'Milestones mark significant points, not work.'],
  ['Stakeholders are:', ['Only the developers', 'Anyone affected by or affecting the project', 'Only investors', 'Only end users'], 1, 'They include users, sponsors, team and regulators.'],
]);

export const subjectQuestionBanks: Record<string, Question[]> = {
  'ceit-4031': dbms,
  'ceit-5051': operatingSystem,
};

export const fieldQuestionBanks: Record<string, Question[]> = {
  'electronic-hardware': hardware,
  software,
  'network-communication': network,
  security,
  'data-science': dataScience,
  'signal-processing': signal,
  'project-management': projectManagement,
};

export const allQuestions: Question[] = [
  ...Object.values(subjectQuestionBanks).flat(),
  ...Object.values(fieldQuestionBanks).flat(),
];
