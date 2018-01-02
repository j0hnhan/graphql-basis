const graphql =  require('graphql');
const _ = require('lodash');
const axios = require('axios');

const {
	GraphQLObjectType,
	GraphQLString,
	GraphQLInt,
	GraphQLSchema,
	GraphQLList,
	GraphQLNonNull
} = graphql;

// const users = [
// 	{ id: "32", firstName: "Bill", age: 24 },
// 	{ id: "41", firstName: "John", age: 30 }
// ];

const CompanyType = new GraphQLObjectType({
	name: 'Company',
	fields: () => ({
		id: { type: GraphQLString },
		name: { type: GraphQLString },
		description: { type: GraphQLString },
		users: {
			type: new GraphQLList(UserType),
			resolve(parentValue, args) {
				return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`)
						.then(res => res.data)
			}
		}
	})
});

const UserType = new GraphQLObjectType({
	name: 'User',
	fields: () => ({
		id: { type: GraphQLString },
		firstName: { type: GraphQLString },
		age: { type: GraphQLInt },
		company: {
			type: CompanyType,
			resolve(parentValue, args) {
				return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
						.then(res => res.data);
			}
		}
	})
});

/*
	RootQuery entry: user, company
	query through API and integrate
	Query Example:
	{
		user(id: "41") {
			id
			firstName
			age
			company {
				id
				name
				description
			}
		}
	}
	{
		company(id: "1") {
			name
			description
			users {
		  		id
		  		firstName
		  		age
			}
		}
	}	
 */

const RootQuery = new GraphQLObjectType({
	name: 'RootQueryType',
	fields: {
		user: {
			type: UserType,
			args: { id: { type: GraphQLString } },
			resolve(parentValue, args) {
				return axios.get(`http://localhost:3000/users/${args.id}`)
						.then(response => response.data);
			}
		},
		company: {
			type: CompanyType,
			args: { id: {type: GraphQLString} },
			resolve(parentValue, args) {
				return axios.get(`http://localhost:3000/companies/${args.id}`)
						.then(res => res.data);
			}
		}
	}
});

/*
	mutation something like method,
	manipulate data with api call
	example query 
	mutation {
		editUser(id: "41", age: 25) {
	    id
	    firstName
	    age
	    company {
	      id
	    }
	  }
	}	
 */

const mutation = new GraphQLObjectType({
	name: 'Mutation',
	fields: {
		addUser: {
			type: UserType,
			args: {
				firstName: { type: new GraphQLNonNull(GraphQLString) },
				age: { type: GraphQLInt },
				companyId: { type: GraphQLString }
			},
			resolve(parentValue, { firstName, age, companyId }) {
				return axios.post(`http://localhost:3000/users`, {firstName, age, companyId})
						.then(res => res.data);
			}
		},
		deleteUser: {
			type: UserType,
			args: {
				id: { type: new GraphQLNonNull(GraphQLString) }
			},
			resolve(parentValue, args) {
				return axios.delete(`http://localhost:3000/users/${args.id}`)
					.then(res => res.data);
			}
		},
		editUser: {
			type: UserType,
			args: {
				id: { type: new GraphQLNonNull(GraphQLString) },
				firstName: { type: GraphQLString },
				age: { type: GraphQLInt },
				companyId: { type: GraphQLString }
			},
			resolve(parentValue, args) {
				return axios.patch(`http://localhost:3000/users/${args.id}`, args)
					.then(res => res.data);
			}
		}
	}
});

module.exports = new GraphQLSchema({
	mutation: mutation,
	query: RootQuery
})