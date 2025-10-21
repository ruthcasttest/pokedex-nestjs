import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly _pokemonModel: Model<Pokemon>
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();

    try {
      const pokemon = await this._pokemonModel.create( createPokemonDto );

      return pokemon;

    } catch (error) {
      this.handleException(error);
    }
  }

  findAll() {
    return `This action returns all pokemon`;
  }

  async findOne(term: string) {

    let pokemon: Pokemon | null = null;

    if ( ! isNaN(+term) ) {
      pokemon = await this._pokemonModel.findOne({ no: term })
    }

    if ( !pokemon && isValidObjectId(term) ) {
      pokemon = await this._pokemonModel.findById( term )
    }

    if( !pokemon ) {
      pokemon = await this._pokemonModel.findOne({ name: term.toLowerCase().trim() })
    }

    if ( !pokemon ) 
      throw new NotFoundException(`Pokemon with id, name or no ${term} not found`);

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {

    const pokemon = await this.findOne( term );
    if ( updatePokemonDto.name ) {
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase().trim();
    }

    try {
      await pokemon.updateOne( updatePokemonDto, { new: true } );
      return { ...pokemon.toJSON(), ...updatePokemonDto };

    } catch (error) {
      this.handleException(error);
    }
  }

  async remove(id: string) {
    const { deletedCount } = await this._pokemonModel.deleteOne( {_id: id } );

    if ( deletedCount === 0 ){
      throw new BadRequestException(`Pokemon with id ${id} not found`);
    }

    return;
  }

  private handleException(error) {
      if (error.code === 11000) {
        throw new BadRequestException(`Pokemon exists in db ${JSON.stringify( error.keyValue ) }`)
      }

      throw new InternalServerErrorException(`Can't create pokemons, check server logs`);
  }
}
